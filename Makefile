MOZILLA ?= /usr/lib/mozilla
MOZILLA_NATIVE_SYSTEM ?= $(MOZILLA)/native-messaging-hosts
#MOZILLA64 ?= /usr/lib64/mozilla
#MOZILLA_NATIVE_SYSTEM64 ?= $(MOZILLA64)/native-messaging-hosts
LIBEXEC_SYSTEM ?= /usr/local/libexec
TEXTERN_SYSTEM ?= $(LIBEXEC_SYSTEM)/textern

MOZILLA_NATIVE_USER ?= $(HOME)/.mozilla/native-messaging-hosts
TEXTERN_USER ?= $(HOME)/.local/libexec/textern

.PHONY: all
all:
	@echo "No build step. Available targets:"
	@echo "native-install-system     install native app for all user"
	@echo "native-uninstall-system   uninstall native app for all user"
	@echo "native-install-user       install native app only for current user"
	@echo "native-uninstall-user     uninstall native app for current user"
	@echo "xpi                       create XPI webex archive"

.PHONY: native-install-system
native-install-system:
	mkdir -p $(DESTDIR)$(MOZILLA_NATIVE_SYSTEM)
	chmod o+rX $(DESTDIR)$(MOZILLA)
	chmod o+rX $(DESTDIR)$(MOZILLA_NATIVE_SYSTEM)
	sed -e 's|@@NATIVE_PATH@@|$(TEXTERN_SYSTEM)/textern.py|' native/textern.json.in > $(DESTDIR)$(MOZILLA_NATIVE_SYSTEM)/textern.json
	chmod o+r $(DESTDIR)$(MOZILLA_NATIVE_SYSTEM)/textern.json
	#mkdir -p $(DESTDIR)$(MOZILLA_NATIVE_SYSTEM64)
	#chmod o+rX $(DESTDIR)$(MOZILLA64)
	#chmod o+rX $(DESTDIR)$(MOZILLA_NATIVE_SYSTEM64)
	#ln -s $(DESTDIR)$(MOZILLA_NATIVE_SYSTEM)/textern.json $(DESTDIR)$(MOZILLA_NATIVE_SYSTEM64)/textern.json

	mkdir -p $(DESTDIR)$(TEXTERN_SYSTEM)
	chmod o+rX $(DESTDIR)$(LIBEXEC_SYSTEM)
	cp -rf native/textern.py native/inotify_simple $(DESTDIR)$(TEXTERN_SYSTEM)
	chmod -R o+rX $(DESTDIR)$(TEXTERN_SYSTEM)

.PHONY: native-uninstall-system
native-uninstall-system:
	rm -f $(DESTDIR)$(MOZILLA_NATIVE_SYSTEM)/textern.json
	rm -f $(DESTDIR)$(MOZILLA_NATIVE_SYSTEM64)/textern.json
	rm -rf $(DESTDIR)$(TEXTERN_SYSTEM)

.PHONY: native-install-user
native-install-user:
	mkdir -p $(DESTDIR)$(MOZILLA_NATIVE_USER)
	sed -e 's|@@NATIVE_PATH@@|$(TEXTERN_USER)/textern.py|' native/textern.json.in > $(DESTDIR)$(MOZILLA_NATIVE_USER)/textern.json

	mkdir -p $(DESTDIR)$(TEXTERN_USER)
	cp -rf native/textern.py native/inotify_simple $(DESTDIR)$(TEXTERN_USER)

.PHONY: native-uninstall-user
native-uninstall-user:
	rm -f $(DESTDIR)$(MOZILLA_NATIVE_USER)/textern.json
	rm -rf $(DESTDIR)$(TEXTERN_USER)

.PHONY: xpi
xpi:
	@rm -f textern.xpi && cd webex && zip -r -FS ../textern.xpi *

# vim: filetype=make tabstop=8 softtabstop=8 shiftwidth=8 noexpandtab autoindent nowrap
