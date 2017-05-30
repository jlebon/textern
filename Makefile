ifneq ($(USER),1)
	PREFIX ?= $(DESTDIR)/usr/local
	MOZILLA_PREFIX ?= $(DESTDIR)/usr
	MOZILLA_NATIVE ?= $(MOZILLA_PREFIX)/lib64/mozilla/native-messaging-hosts
else
	PREFIX ?= $(HOME)/.local
	MOZILLA_NATIVE ?= $(HOME)/.mozilla/native-messaging-hosts
endif

LIBEXEC ?= $(PREFIX)/libexec

.PHONY: all
all:
	@echo "No build step. Available targets:"
	@echo "native-install          install native app"
	@echo "native-uninstall        uninstall native app"
	@echo
	@echo "Set USER=1 to target user directories instead."

# make phony and don't depend on .in file in case $USER changes
.PHONY: native/textern.json
native/textern.json:
	sed -e 's|@@NATIVE_PATH@@|$(LIBEXEC)/textern/textern.py|' $@.in > $@

.PHONY: native-install
native-install: native/textern.json
	mkdir -p $(MOZILLA_NATIVE)
	cp -f native/textern.json $(MOZILLA_NATIVE)
	mkdir -p $(LIBEXEC)/textern
	cp -rf native/textern.py native/inotify_simple $(LIBEXEC)/textern

.PHONY: native-uninstall
native-uninstall:
	rm -f $(MOZILLA_NATIVE)/textern.json
	rm -rf $(LIBEXEC)/textern
