.PHONY: all clean windows mac linux mac-intel mac-arm zip dmg deb icon

OUTPUT_DIR = ../public/downloads
APP_NAME = DoINeedAnUpgrade
SWIFT_SRC = macos-gui/main.swift macos-gui/Scanner.swift
ICON_SRC = ../public/icon-512.png
ICONSET_DIR = .icon-cache/$(APP_NAME).iconset
ICNS_FILE = .icon-cache/$(APP_NAME).icns

all: windows mac linux

$(OUTPUT_DIR):
	mkdir -p $(OUTPUT_DIR)

# Generate macOS .icns from source PNG
icon:
	@mkdir -p $(ICONSET_DIR)
	@sips -z 16 16     $(ICON_SRC) --out $(ICONSET_DIR)/icon_16x16.png      > /dev/null
	@sips -z 32 32     $(ICON_SRC) --out $(ICONSET_DIR)/icon_16x16@2x.png   > /dev/null
	@sips -z 32 32     $(ICON_SRC) --out $(ICONSET_DIR)/icon_32x32.png      > /dev/null
	@sips -z 64 64     $(ICON_SRC) --out $(ICONSET_DIR)/icon_32x32@2x.png   > /dev/null
	@sips -z 128 128   $(ICON_SRC) --out $(ICONSET_DIR)/icon_128x128.png    > /dev/null
	@sips -z 256 256   $(ICON_SRC) --out $(ICONSET_DIR)/icon_128x128@2x.png > /dev/null
	@sips -z 256 256   $(ICON_SRC) --out $(ICONSET_DIR)/icon_256x256.png    > /dev/null
	@sips -z 512 512   $(ICON_SRC) --out $(ICONSET_DIR)/icon_256x256@2x.png > /dev/null
	@sips -z 512 512   $(ICON_SRC) --out $(ICONSET_DIR)/icon_512x512.png    > /dev/null
	@iconutil -c icns $(ICONSET_DIR) -o $(ICNS_FILE)
	@rm -rf $(ICONSET_DIR)

windows: $(OUTPUT_DIR)
	@echo "Generating Windows icon sizes..."
	@sips -z 16 16   $(ICON_SRC) --out winres/icon-16.png > /dev/null
	@sips -z 32 32   $(ICON_SRC) --out winres/icon-32.png > /dev/null
	@sips -z 48 48   $(ICON_SRC) --out winres/icon-48.png > /dev/null
	@sips -z 64 64   $(ICON_SRC) --out winres/icon-64.png > /dev/null
	@sips -z 256 256 $(ICON_SRC) --out winres/icon.png    > /dev/null
	@echo "Generating Windows resources..."
	@cd . && go run github.com/tc-hib/go-winres@latest make --in winres/winres.json
	GOOS=windows GOARCH=amd64 go build -ldflags="-s -w -H=windowsgui" -o $(OUTPUT_DIR)/$(APP_NAME).exe .
	@rm -f rsrc_windows_*.syso

mac: mac-intel mac-arm

mac-intel: $(OUTPUT_DIR) icon
	@echo "Building macOS Intel .app bundle (Swift GUI)..."
	@rm -rf "$(OUTPUT_DIR)/$(APP_NAME)-Mac-Intel.app"
	@mkdir -p "$(OUTPUT_DIR)/$(APP_NAME)-Mac-Intel.app/Contents/MacOS"
	@mkdir -p "$(OUTPUT_DIR)/$(APP_NAME)-Mac-Intel.app/Contents/Resources"
	@cp $(ICNS_FILE) "$(OUTPUT_DIR)/$(APP_NAME)-Mac-Intel.app/Contents/Resources/$(APP_NAME).icns"
	@swiftc -O -target x86_64-apple-macosx10.13 \
		-o "$(OUTPUT_DIR)/$(APP_NAME)-Mac-Intel.app/Contents/MacOS/$(APP_NAME)" \
		$(SWIFT_SRC)
	@printf '%s\n' \
		'<?xml version="1.0" encoding="UTF-8"?>' \
		'<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">' \
		'<plist version="1.0">' \
		'<dict>' \
		'  <key>CFBundleExecutable</key>' \
		'  <string>$(APP_NAME)</string>' \
		'  <key>CFBundleIconFile</key>' \
		'  <string>$(APP_NAME)</string>' \
		'  <key>CFBundleIdentifier</key>' \
		'  <string>com.doineedanupgrade.scanner</string>' \
		'  <key>CFBundleName</key>' \
		'  <string>$(APP_NAME)</string>' \
		'  <key>CFBundlePackageType</key>' \
		'  <string>APPL</string>' \
		'  <key>CFBundleVersion</key>' \
		'  <string>1.0</string>' \
		'  <key>LSMinimumSystemVersion</key>' \
		'  <string>10.13</string>' \
		'</dict>' \
		'</plist>' > "$(OUTPUT_DIR)/$(APP_NAME)-Mac-Intel.app/Contents/Info.plist"
	@codesign --force --deep -s - "$(OUTPUT_DIR)/$(APP_NAME)-Mac-Intel.app"

mac-arm: $(OUTPUT_DIR) icon
	@echo "Building macOS Apple Silicon .app bundle (Swift GUI)..."
	@rm -rf "$(OUTPUT_DIR)/$(APP_NAME)-Mac-AppleSilicon.app"
	@mkdir -p "$(OUTPUT_DIR)/$(APP_NAME)-Mac-AppleSilicon.app/Contents/MacOS"
	@mkdir -p "$(OUTPUT_DIR)/$(APP_NAME)-Mac-AppleSilicon.app/Contents/Resources"
	@cp $(ICNS_FILE) "$(OUTPUT_DIR)/$(APP_NAME)-Mac-AppleSilicon.app/Contents/Resources/$(APP_NAME).icns"
	@swiftc -O -target arm64-apple-macosx11.0 \
		-o "$(OUTPUT_DIR)/$(APP_NAME)-Mac-AppleSilicon.app/Contents/MacOS/$(APP_NAME)" \
		$(SWIFT_SRC)
	@printf '%s\n' \
		'<?xml version="1.0" encoding="UTF-8"?>' \
		'<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">' \
		'<plist version="1.0">' \
		'<dict>' \
		'  <key>CFBundleExecutable</key>' \
		'  <string>$(APP_NAME)</string>' \
		'  <key>CFBundleIconFile</key>' \
		'  <string>$(APP_NAME)</string>' \
		'  <key>CFBundleIdentifier</key>' \
		'  <string>com.doineedanupgrade.scanner</string>' \
		'  <key>CFBundleName</key>' \
		'  <string>$(APP_NAME)</string>' \
		'  <key>CFBundlePackageType</key>' \
		'  <string>APPL</string>' \
		'  <key>CFBundleVersion</key>' \
		'  <string>1.0</string>' \
		'  <key>LSMinimumSystemVersion</key>' \
		'  <string>11.0</string>' \
		'</dict>' \
		'</plist>' > "$(OUTPUT_DIR)/$(APP_NAME)-Mac-AppleSilicon.app/Contents/Info.plist"
	@codesign --force --deep -s - "$(OUTPUT_DIR)/$(APP_NAME)-Mac-AppleSilicon.app"

APPIMAGE_CACHE = .appimage-cache

linux: $(OUTPUT_DIR)
	@echo "Building Linux AppImage..."
	@# Cross-compile Go binary for Linux
	@CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o $(OUTPUT_DIR)/$(APP_NAME)-Linux-bin .
	@# Prepare AppDir structure
	@rm -rf $(APPIMAGE_CACHE)/AppDir
	@mkdir -p $(APPIMAGE_CACHE)/AppDir/usr/bin
	@cp $(OUTPUT_DIR)/$(APP_NAME)-Linux-bin $(APPIMAGE_CACHE)/AppDir/usr/bin/$(APP_NAME)
	@cp linux-appimage/DoINeedAnUpgrade.desktop $(APPIMAGE_CACHE)/AppDir/$(APP_NAME).desktop
	@cp ../public/icon-512.png $(APPIMAGE_CACHE)/AppDir/$(APP_NAME).png
	@printf '#!/bin/sh\nHERE=$$(dirname "$$(readlink -f "$$0")")\nexec "$$HERE/usr/bin/$(APP_NAME)" "$$@"\n' \
		> $(APPIMAGE_CACHE)/AppDir/AppRun
	@chmod +x $(APPIMAGE_CACHE)/AppDir/AppRun
	@# Build AppImage using Docker (works from macOS without FUSE)
	@docker run --rm \
		-v $(CURDIR)/$(APPIMAGE_CACHE):/work \
		--platform linux/amd64 \
		ubuntu:22.04 \
		bash -c '\
			apt-get update -qq && apt-get install -y -qq curl file > /dev/null 2>&1 && \
			curl -fsSL -o /usr/local/bin/appimagetool \
				https://github.com/AppImage/appimagetool/releases/download/continuous/appimagetool-x86_64.AppImage && \
			chmod +x /usr/local/bin/appimagetool && \
			sed -i "s|AI\x02|\x00\x00\x00|" /usr/local/bin/appimagetool && \
			ARCH=x86_64 appimagetool --appimage-extract-and-run /work/AppDir /work/$(APP_NAME)-Linux.AppImage \
		'
	@mv $(APPIMAGE_CACHE)/$(APP_NAME)-Linux.AppImage $(OUTPUT_DIR)/$(APP_NAME)-Linux.AppImage
	@# Clean up intermediates
	@rm -f $(OUTPUT_DIR)/$(APP_NAME)-Linux-bin
	@rm -rf $(APPIMAGE_CACHE)/AppDir
	@echo "Built $(OUTPUT_DIR)/$(APP_NAME)-Linux.AppImage"

# Create zip files for distribution
zip: mac
	@echo "Creating zip files for macOS apps..."
	@xattr -cr "$(OUTPUT_DIR)/$(APP_NAME)-Mac-Intel.app"
	@xattr -cr "$(OUTPUT_DIR)/$(APP_NAME)-Mac-AppleSilicon.app"
	@cd $(OUTPUT_DIR) && zip -r $(APP_NAME)-Mac-Intel.zip $(APP_NAME)-Mac-Intel.app
	@cd $(OUTPUT_DIR) && zip -r $(APP_NAME)-Mac-AppleSilicon.zip $(APP_NAME)-Mac-AppleSilicon.app

DMG_STAGING = .dmg-staging

dmg: mac
	@echo "Creating DMG files..."
	@rm -rf $(DMG_STAGING)
	@mkdir -p $(DMG_STAGING)/intel $(DMG_STAGING)/arm
	@cp -r "$(OUTPUT_DIR)/$(APP_NAME)-Mac-Intel.app" $(DMG_STAGING)/intel/
	@ln -s /Applications $(DMG_STAGING)/intel/Applications
	@hdiutil create -volname "$(APP_NAME)" -srcfolder $(DMG_STAGING)/intel \
		-ov -format UDZO "$(OUTPUT_DIR)/$(APP_NAME)-Mac-Intel.dmg"
	@cp -r "$(OUTPUT_DIR)/$(APP_NAME)-Mac-AppleSilicon.app" $(DMG_STAGING)/arm/
	@ln -s /Applications $(DMG_STAGING)/arm/Applications
	@hdiutil create -volname "$(APP_NAME)" -srcfolder $(DMG_STAGING)/arm \
		-ov -format UDZO "$(OUTPUT_DIR)/$(APP_NAME)-Mac-AppleSilicon.dmg"
	@rm -rf $(DMG_STAGING)
	@echo "Created DMG files"

deb: $(OUTPUT_DIR)
	@echo "Building Linux .deb package..."
	@CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o $(OUTPUT_DIR)/$(APP_NAME)-Linux-bin .
	@rm -rf $(APPIMAGE_CACHE)/deb
	@mkdir -p $(APPIMAGE_CACHE)/deb/DEBIAN
	@mkdir -p $(APPIMAGE_CACHE)/deb/usr/bin
	@mkdir -p $(APPIMAGE_CACHE)/deb/usr/share/applications
	@mkdir -p $(APPIMAGE_CACHE)/deb/usr/share/icons/hicolor/256x256/apps
	@cp $(OUTPUT_DIR)/$(APP_NAME)-Linux-bin $(APPIMAGE_CACHE)/deb/usr/bin/$(APP_NAME)
	@chmod 755 $(APPIMAGE_CACHE)/deb/usr/bin/$(APP_NAME)
	@cp linux-appimage/$(APP_NAME).desktop $(APPIMAGE_CACHE)/deb/usr/share/applications/
	@cp ../public/icon-512.png $(APPIMAGE_CACHE)/deb/usr/share/icons/hicolor/256x256/apps/$(APP_NAME).png
	@printf 'Package: doineedanupgrade\nVersion: 1.0\nSection: utils\nPriority: optional\nArchitecture: amd64\nMaintainer: DoINeedAnUpgrade\nDescription: Hardware scanner for DoINeedAnUpgrade\n Detects hardware specs and opens the web app.\n' \
		> $(APPIMAGE_CACHE)/deb/DEBIAN/control
	@docker run --rm \
		-v $(CURDIR)/$(APPIMAGE_CACHE):/work \
		--platform linux/amd64 \
		ubuntu:22.04 \
		bash -c 'dpkg-deb --build /work/deb /work/$(APP_NAME)-Linux.deb'
	@mv $(APPIMAGE_CACHE)/$(APP_NAME)-Linux.deb $(OUTPUT_DIR)/$(APP_NAME)-Linux.deb
	@rm -f $(OUTPUT_DIR)/$(APP_NAME)-Linux-bin
	@rm -rf $(APPIMAGE_CACHE)/deb
	@echo "Built $(OUTPUT_DIR)/$(APP_NAME)-Linux.deb"

clean:
	rm -rf $(OUTPUT_DIR)/$(APP_NAME)*
	rm -rf $(APPIMAGE_CACHE)
	rm -rf $(DMG_STAGING)
	rm -rf .icon-cache
	rm -f rsrc_windows_*.syso
