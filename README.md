# Textern

Textern is a Firefox add-on that allows you to edit text
areas in web pages using an external editor. It is similar
in functionality to the popular
[It's All Text!](https://addons.mozilla.org/en-US/firefox/addon/its-all-text/)
add-on, though makes use of the WebExtension API and is thus
fully compatible with
[multiprocessing](https://wiki.mozilla.org/Electrolysis) and
planned to be supported beyond
[Firefox 57](https://blog.mozilla.org/addons/2017/02/16/the-road-to-firefox-57-compatibility-milestones/).

The add-on is divided into two parts:

- the WebExtension, which is available from AMO [here](https://addons.mozilla.org/addon/textern/), and
- the native application, which handles text editor
  launching and monitoring.

The native application currently supports Linux or macOS with
Python 3.5. Patches to add support for other platforms are
welcome!

## Installation

To clone the repository:

```
$ git clone --recurse-submodules https://github.com/jlebon/textern
$ cd textern
```

IMPORTANT: make sure that your git checkout includes
submodules (either use the `--recurse-submodules` when
running `git clone` as shown above, or use
`git submodule update --init` if already cloned).

To install the native app, run:

```
$ sudo make native-install
```

To uninstall it, run:

```
$ sudo make native-uninstall
```

If you do not have root privileges or wish to only install
the native app for the current user, run:

```
$ make native-install USER=1
```


### Note for macOS

If you installed Python via [homebrew](https://brew.sh/), note
that `/usr/local/bin` is *not* on the PATH by default, so
`textern.py` cannot find it. You either need to adjust your
PATH globally, the exact procedure for which seems to [change with
each macOS version](https://stackoverflow.com/a/32902449/1885340),
or edit the first line of `native/textern.py` to read
`#!/usr/local/bin/python3` and repeating the `make native-install` call.


## Usage

Once both the WebExtension and the native application are
installed, you can select any textbox and press Ctrl+Shift+D
to open an external editor. By default, gedit is opened. You
can change both the key mapping as well as the configured
editor in the addon preferences. Additional parameters may
be passed to the editor. For example:

```
["myeditor", "--custom-arg"]
```

will launch `myeditor --custom-arg /path/to/file.txt`. You
may use `%s` as a variable for the file path if don't want
it to be the last argument.

If your editor supports it, you can also use `%l` and `%c`
to pass the line and column number of the caret position.
(The capitalized versions `%L` and `%C` also exist which are
smaller by one for text editors that count from zero). For
example, passing this information to `gvim` (or `vim`):

```
["gvim", "-f", "+call cursor(%l,%c)"]
```

### Terminal editors

If you would like to use a terminal editor such as vim or
emacs, you will need to modify the configuration such that
Textern starts a terminal emulator which runs the text
editor. For example, for `nvim` this could look like

```
["xterm", "-e", "nvim", "+call cursor(%l,%c)"]
```

Here, `xterm` is the terminal emulator, `-e` instructs it to
start a program, which is `nvim` (the editor we're actually
interested in) with the given parameters.

This works similarly with `konsole` instead of `xterm`.

#### Notes on gnome-terminal

If you would like to use gnome-terminal to spawn a terminal
editor like vim or emacs, note that you will need to work
around the fact that the gnome-terminal process *does not*
wait for the spawned process before exiting. This will cause
Textern to stop listening for text updates. See
https://bugzilla.gnome.org/show_bug.cgi?id=707899#c4 for
more information. You can work around this by using the
script
[here](https://github.com/jlebon/files/blob/master/bin/gnome-terminal-wrapper),
and prepend your command. For example, to run vim, you can
set your editor in the preferences to something like

```
["gnome-terminal-wrapper", "vim"]
```

and make sure, that `gnome-terminal-wrapper` is in your
`PATH`.

### Notes on the macOS Terminal.app

As it operates similarly to gnome-terminal (described above),
it has the same issue with exiting prematurely. An appropriate
wrapper script can be found
[here](https://gist.github.com/wosc/680f87845d0fd9d8b4a9e2f8c42f98a2)


### GUI editors

Non-terminal-based editors can also suffer from the same
problem described above. For example, gedit does not fork
and thus can be used directly:

```
["gedit"]
```

On the other hand, `gvim` by default will fork and detach.
One must thus make sure to pass the `-f` switch for it to
stay in the foreground:

```
["gvim", "-f"]
```

## Related Projects

### It's All Text!

https://github.com/docwhat/itsalltext/

This is the project that inspired this add-on.
Unfortunately, it is not compatible with WebExtensions and
thus cannot be installed on Firefox 57 or later.

### Tridactyl

https://github.com/cmcaine/tridactyl

Generic addon that adds Vim-like bindings to Firefox,
including an `:editor` command which provides similar
functionality to Textern.

### withExEditor

https://github.com/asamuzaK/withExEditor

Similar to Textern and supports WebExtensions. Native app is
cross-platform but requires Node.js.

### GhostText

https://github.com/GhostText/GhostText

Uses editor-specific plugins to provide two-way on-the-fly
sync between webpage and editor.
