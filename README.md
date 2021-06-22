
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

The native application currently only supports Linux with
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

On distros which do not use `/usr/lib64` (such as
Debian/Ubuntu), you'll want to override `LIBDIR`:

```
$ sudo make native-install LIBDIR=/usr/lib
```

If you do not have root privileges or wish to only install
the native app for the current user, run:

```
$ make native-install USER=1
```

## Usage

Once both the WebExtension and the native application are
installed, you can select any textbox and press Ctrl+Shift+D
to open an external editor. The textarea will flash yellow
upon launching the text editor, as well as whenever the file
is saved.

By default, gedit is opened. You can change both the key
mapping as well as the configured editor in the addon
preferences. Additional parameters may be passed to the
editor. For example:

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

Example for emacs:

```
["emacs", "%s", "--eval", "(progn (goto-line %l) (move-to-column (1- %c)))"]
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

This works similarly with `konsole` or `gnome-terminal`
instead of `xterm`. For example, starting `vim` with
`gnome-terminal`:

```
["gnome-terminal", "--wait", "--", "vim", "+call cursor(%l,%c)"]
```

Note that by default the `gnome-terminal` process won't wait
for the spawned process to finish before exiting so you'll
need to make sure you add the `--wait` flag.

### GUI editors

Non-terminal-based editors can also suffer from the same
waiting problem described above. For example, gedit does not
fork and thus can be used directly:

```
["gedit"]
```

On the other hand, `gvim` by default will fork and detach.
One must thus make sure to pass the `-f` switch for it to
stay in the foreground:

```
["gvim", "-f"]
```

#### Flatpak

##### Flatpak editor

Flatpak-packaged editors should work fine, as long as the
application has access to the `XDG_RUNTIME_DIR` directory.
For example, to use the GNOME gedit flatpak, use:

```
["flatpak", "run", "--filesystem=xdg-run/textern", "org.gnome.gedit"]
```

##### Flatpak Firefox

###### Mozilla Flatpak permissions

If you use [the Firefox
flatpak](https://flathub.org/apps/details/org.mozilla.firefox), it's possible to
install and use Textern like this.

Create a file `.local/share/flatpak/overrides/org.mozilla.firefox` with this
content:

```
[Context]
filesystems=xdg-run/textern
persistent=.local/libexec

[Session Bus Policy]
org.freedesktop.Flatpak=talk
```

- `filesystems=xdg-run/textern` is so that the editor on the host can access the temporary files.
- `persistent=.local/libexec` is so that extensions can access the native application.
- `org.freedesktop.Flatpak=talk` is so that the flatpak is allowed to run
  commands on the host system using `flatpak-spawn`.

Alternately set the same settings using the application Flatseal or using the
corresponding `flatpak override` commands.

###### Install native extension

On host system, in `~/Downloads`, do the checkout:

```bash
cd ~/Downloads
git clone --recurse-submodules https://github.com/jlebon/textern
```

Open shell inside the flatpak:

```bash
flatpak run --command='bash' org.mozilla.firefox
```

Run the installation from the checked out repository:

```bash
cd ~/Downloads/textern
make native-install USER=1
```

###### Textern editor command

In the Textern settings, prefix your usual editor command with `"flatpak-spawn",
"--host"`, for example like this if your editor is also in a Flatpak:

```
["flatpak-spawn", "--host", "flatpak", "run", "--filesystem=xdg-run/textern", "org.gnome.gedit"]
```

## Troubleshooting

Some things to try if it doesn't work properly:

 * Ensure you are running the latest version of Firefox
 * Try configuring Textern to launch using a different shortcut
 * Try configuring Textern to use the following as the external editor: `["sh", "-c", "echo foobar > $0"]` (that should just echo foobar into the textarea box)
 * Check the browser console for errors (Ctrl+Shift+J)
 * Check the extension's console for errors (Go to `about:debugging`, find Textern in the list of extensions, and click Inspect)
 * Make sure you cloned the repo with `--recurse-submodules` (see installation instructions above)
 * Try re-installing but for your local user (`make native-install USER=1` instead of `sudo make native-install`)
 * Check if Textern is running in the background (`ps aux | grep textern`)

### Firejail

[Firejail](https://firejail.wordpress.com/) is a sandboxing program to restrict what your browser can do. It will prevent Textern from working.

If you install Textern with USER=1, and your firejail instance is not using apparmor, then add to /etc/firejail/firejail.local:

    whitelist ${HOME}/.local/libexec/textern/
    noblacklist ${PATH}/python3*
    noblacklist /usr/lib/python3*

If apparmor is enabled, then add the Python lines to firejail.local and see [issue 52](#52).

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
