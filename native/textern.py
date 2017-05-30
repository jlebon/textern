#!/usr/bin/env python3
# vim: set et ts=4 tw=80:
#
# Copyright (C) 2017 Jonathan Lebon
#
# This file is part of Textern.
# Textern is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Textern is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with Textern.  If not, see <http://www.gnu.org/licenses/>.

import os
import sys
import json
import shutil
import struct
import asyncio
import tempfile
from inotify_simple.inotify_simple import INotify, flags


class TmpManager():

    def __init__(self):
        self.tmpdir = tempfile.mkdtemp(prefix="textern-")
        self._tmpfiles = {}  # relfn --> opaque

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        shutil.rmtree(self.tmpdir)

    def new(self, text, ext, opaque):
        f, absfn = tempfile.mkstemp(dir=self.tmpdir, suffix=("." + ext))
        # this itself will cause a harmless inotify event, though as a cool
        # side effect, we get an initial highlighting of the text area which is
        # nice feedback that the command was received
        os.write(f, text.encode("utf-8"))
        os.close(f)
        relfn = os.path.basename(absfn)
        assert relfn not in self._tmpfiles
        self._tmpfiles[relfn] = opaque
        return absfn

    def delete(self, absfn):
        relfn = os.path.basename(absfn)
        assert relfn in self._tmpfiles
        self._tmpfiles.pop(relfn)
        os.unlink(absfn)

    def get(self, relfn):
        assert relfn in self._tmpfiles
        with open(os.path.join(self.tmpdir, relfn), encoding='utf-8') as f:
            return f.read(), self._tmpfiles[relfn]

    def has(self, relfn):
        return relfn in self._tmpfiles


def main():
    with INotify() as ino, TmpManager() as tmp_mgr:
        ino.add_watch(tmp_mgr.tmpdir, flags.CLOSE_WRITE)
        loop = asyncio.get_event_loop()
        loop.add_reader(sys.stdin.buffer, handle_stdin, tmp_mgr)
        loop.add_reader(ino.fd, handle_inotify_event, ino, tmp_mgr)
        loop.run_forever()
        loop.close()


def handle_stdin(tmp_mgr):
    # In theory, these reads could block, since we only know that there is some
    # data, but not that all the data is there. We could be more strict here by
    # reading in a separate thread. In practice, we're trusting that we're
    # talking with Firefox and that readiness implies a full message (length +
    # content) is ready to be read.
    loop = asyncio.get_event_loop()
    raw_length = sys.stdin.buffer.read(4)
    if len(raw_length) == 0:
        loop.stop()
        return
    length = struct.unpack('@I', raw_length)[0]
    raw_message = sys.stdin.buffer.read(length)
    if len(raw_message) != length:
        raise Exception("expected %d bytes, but got %d" % (length,
                                                           len(raw_message)))
    message = json.loads(raw_message.decode('utf-8'))
    loop.create_task(handle_message(tmp_mgr, message))


def get_editor_args(editor_args_str, absfn):
    editor_args = json.loads(editor_args_str)
    if "%s" not in editor_args:
        editor_args.append("%s")
    editor_args[editor_args.index("%s")] = absfn
    return editor_args


async def handle_message(tmp_mgr, msg):
    await message_handlers[msg["type"]](tmp_mgr, msg["payload"])


async def handle_message_new_text(tmp_mgr, msg):
    absfn = tmp_mgr.new(msg["text"], msg["prefs"]["extension"], msg["id"])
    editor_args = get_editor_args(msg["prefs"]["editor"], absfn)
    try:
        proc = await asyncio.create_subprocess_exec(
            *editor_args,
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.DEVNULL
        )
    except FileNotFoundError:
        send_error("could not find editor '%s'" % editor_args[0])
    else:
        await proc.wait()
        if proc.returncode != 0:
            send_error("editor '%s' did not exit successfully"
                       % editor_args[0])
    finally:
        send_death_notice(msg["id"])
        tmp_mgr.delete(absfn)


message_handlers = {
    "new_text": handle_message_new_text,
}


def handle_inotify_event(ino, tmp_mgr):
    for event in ino.read():
        # this check is relevant in the case where we're handling the inotify
        # event caused by tmp_mgr.new(), but then an exception occurred in
        # handle_message() which caused the tmpfile to already be deleted
        if tmp_mgr.has(event.name):
            text, id = tmp_mgr.get(event.name)
            send_text_update(id, text)


def send_text_update(id, text):
    send_raw_message("text_update", {"id": id, "text": text})


def send_death_notice(id):
    send_raw_message("death_notice", {"id": id})


def send_error(error):
    send_raw_message("error", {"error": error})


def send_raw_message(type, payload):

    # This is *also* potentially blocking, so to be more strict we'd delegate
    # this to a thread. Though in practice, we expect Firefox to clear the pipe
    # quickly enough.

    # writing as part of the event loop here means we don't have to lock stdout
    raw_msg = json.dumps({"type": type, "payload": payload}).encode('utf-8')
    sys.stdout.buffer.write(struct.pack('@I', len(raw_msg)))
    sys.stdout.buffer.write(raw_msg)
    sys.stdout.buffer.flush()


def dbg(*args):
    print(*args, file=sys.stderr)
    sys.stderr.flush()


if __name__ == "__main__":
    sys.exit(main())
