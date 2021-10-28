# Media Filesystem (digiKam extension)
Look through media files (images/videos/audio) using any search combination between DigiKam tags, files metadata (e.g. ISO, width, size), file type, filename

# How to use it
Only `SELECT` queries are made between this project and the DigiKam SQLite database, thus no modifications are made to it.

## Prerequisites
- PostgreSQL
- FFmpeg
- NodeJS

## Install steps
- clone repo
- `cd` in the repo
- copy `.env.example` to `.env`
- go to `src/ui/public`
    - create `media` symlink to digiKam collection folder required to be named `media`. E.g. `ln -s /digikam/media media`
    - create `config` symlink to config folder required to be named `config` (*CONFIG_FOLDER_NAME* in `.env`). E.g. `mklink /D config /path/set/in/env/config`
    - directory symlink creation commands (would probably need priviledges)
        - linux (bash): `ln -s Target Link`
        - windows (CMD): `mklink /D Link Target`
- start a PostgreSQL server and enter its data in the `.env` file parameters
- now, let's open 2 terminals both the UI and Server:
    - terminal 1: UI
        - `cd src/ui`
        - `npm install`
        - `npm start`
    - terminal 2: Server
        - `cd src/server`
        - `npm install`
        - `npm start`
- open browser, go to localhost:3000
- have fun!

## Functionalities
- search by:
    - media files metadata
    - digikam categories
    - filename
    - media file type
- get search result (as symbolik links) in a path available file manager (e.g.nautilis, explorer etc.)
- upload files from another (non-digikam) path
    - won't have the categories available on it

# Support
- DigiKam tags (also called *categories*) functionality doesn't work if tags contain '`_`' (underscores)

## Operating systems
- Linux (tested on Ubuntu 20.04)
- Windows (tested on Windows 10)

## Why does this repo exist?
- learn / practice nodejs, reactjs and typescript
- trying to integrate some of the DigiKam functionalities in a new platform with extra features

# Contribute
Drop an issue if you have any questions, suggestions or observations. Other not yet implemented cool features I've been thinking about can be found in the TODO file or in code marked with // TODO.

## About the code
- media files are processed using multi-threading
- project doesn't modify the DigiKam SQLite database at all
- aggregated metadata per media file type (image, video, audio)
- creates preview gifs from videos with ffmpeg

# Credits
- [Digikam](https://www.digikam.org)