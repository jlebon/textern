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

- the WebExtension, which is planned to be added to
  [AMO](https://addons.mozilla.org/), and
- the native application, which handles text editor
  launching and monitoring.

The native application currently only supports Linux with
Python 3.5. Patches to add support for other platforms are
welcome!

## Installation

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

## Usage

Once both the WebExtension and the native application are
installed, you can select any textbox and press Ctrl+Shift+E
to open an external editor. By default, gedit is opened, but
you can change the configured editor in the addon
preferences.
