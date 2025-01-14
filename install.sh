####################################################################################################
# dev-cache installation script
# This script will install dev-cache on your machine
#
# Note:this script is only tested on macOS/zsh only
####################################################################################################

DC_DIR="$HOME/.dev-cache"
DC_BINARY_URL="https://github.com/ziv/dev-cache-build/releases/download/v0.0.1/dev-cache"

echo "Installing Zoominfo dev-cache:"
echo "------------------------------"

# create app directory
printf "%s" "- Creating application directory at '$DC_DIR'..."
echo -n "- Creating application directory at '$DC_DIR'..."
if [ -d "$DC_DIR/bin" ]; then
  echo "directory exists."
else
  mkdir -p "$DC_DIR/bin"
  echo "directory created."
fi
printf "%s" "- Downloading application..."
curl -L -o "$DC_DIR/bin/dev-cache" "$DC_BINARY_URL"
chmod a+x "$DC_DIR/bin/dev-cache"
echo "downloading complete."

printf "%s" "- Add app bin directory to PATH..."
if grep -q "$DC_DIR" "$HOME/.zshrc"; then
  echo "already exists."
else
  echo "export PATH=\"\$PATH:$DC_DIR/bin\"" >> "$HOME/.zshrc" # todo add support for bash...
  source "$HOME/.zshrc"
  echo "added."
fi

echo "Installation complete, run 'dev-cache' to start the application."
