.PHONY: all clean windows mac linux mac-intel mac-arm zip

OUTPUT_DIR = ../public/downloads
APP_NAME = DoINeedAnUpgrade
SWIFT_SRC = macos-gui/main.swift macos-gui/Scanner.swift

all: windows mac linux

$(OUTPUT_DIR):
	mkdir -p $(OUTPUT_DIR)

windows: $(OUTPUT_DIR)
	GOOS=windows GOARCH=amd64 go build -ldflags="-s -w -H=windowsgui" -o $(OUTPUT_DIR)/$(APP_NAME).exe .

mac: mac-intel mac-arm

mac-intel: $(OUTPUT_DIR)
	@echo "Building macOS Intel .app bundle (Swift GUI)..."
	@rm -rf "$(OUTPUT_DIR)/$(APP_NAME)-Mac-Intel.app"
	@mkdir -p "$(OUTPUT_DIR)/$(APP_NAME)-Mac-Intel.app/Contents/MacOS"
	@mkdir -p "$(OUTPUT_DIR)/$(APP_NAME)-Mac-Intel.app/Contents/Resources"
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

mac-arm: $(OUTPUT_DIR)
	@echo "Building macOS Apple Silicon .app bundle (Swift GUI)..."
	@rm -rf "$(OUTPUT_DIR)/$(APP_NAME)-Mac-AppleSilicon.app"
	@mkdir -p "$(OUTPUT_DIR)/$(APP_NAME)-Mac-AppleSilicon.app/Contents/MacOS"
	@mkdir -p "$(OUTPUT_DIR)/$(APP_NAME)-Mac-AppleSilicon.app/Contents/Resources"
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

linux: $(OUTPUT_DIR)
	GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o $(OUTPUT_DIR)/$(APP_NAME)-Linux .

# Create zip files for distribution
zip: mac
	@echo "Creating zip files for macOS apps..."
	@xattr -cr "$(OUTPUT_DIR)/$(APP_NAME)-Mac-Intel.app"
	@xattr -cr "$(OUTPUT_DIR)/$(APP_NAME)-Mac-AppleSilicon.app"
	@cd $(OUTPUT_DIR) && zip -r $(APP_NAME)-Mac-Intel.zip $(APP_NAME)-Mac-Intel.app
	@cd $(OUTPUT_DIR) && zip -r $(APP_NAME)-Mac-AppleSilicon.zip $(APP_NAME)-Mac-AppleSilicon.app

clean:
	rm -rf $(OUTPUT_DIR)/$(APP_NAME)*
