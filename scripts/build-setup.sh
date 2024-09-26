#!/bin/bash

# Installs dependencies needed to build the game

packages=("blender" "wine" "libxcrypt-compat" "bsdtar" "rpm-build")

if command -v apt &> /dev/null; then
	package_manager="apt"
elif command -v dnf &> /dev/null; then
	package_manager="dnf"
elif command -v pacman &> /dev/null; then
	package_manager="pacman"
else
	package_manager=""
fi

if [ -z "$package_manager" ]; then
	echo "Error: Could not detect a supported package manager. Please install packages manually: $packages"
	exit 1
fi

echo "Detected package manager: $package_manager"

case $package_manager in
	apt)
		sudo apt update
		sudo apt install -y "${packages[@]}"
		;;
	dnf)
		sudo dnf install -y "${packages[@]}"
		;;
	pacman)
		sudo pacman -Syu --noconfirm "${packages[@]}"
		;;
	*)
		echo "Unsupported package manager: $package_manager"
		exit 1
		;;
esac
echo "Installation complete!"

