# Screenshots

# How to use it

## Functionalities
- search by media files metadata
- serach by their digikam categories
- search by filename
- combine filename, metadata and categories search
- get search result (as symbolik links) in a path available file manager (e.g.nautilis, explorer etc.)
- upload files from another (non-digikam) path
    - won't have the categories available on it
- 

## Prerequisites
- PostgreSQL

## Install steps
- create symlink in public folder to local media files
- create symlink to config folder
- create database

Windows: mklink /D config D:\Code\media-manager\workdir\config

!!! config_folder_path should have as last directory a folder called as config_folder_name

* Description
Smart search through personal media files (images / videos / audio) based on image classification, object detection & speech 2 text or manual the labeling using DigiKam and its open SQLite DB.

* Tech Stack
- Node
- React
- Tensforflow
- SQLite

!!! doesn't work if tags contain underscore

## About the code
- parallelization with worker/master
- project doesn't modify the DigiKam SQLite database at all
- aggregated metadata per media file type (image, video, audio)
- creates preview gifs from videos with ffmpeg
- parallel processing of media files using workers

## Why does this repo exist?
- practice some nodejs, reactjs and typescript
- trying to create some new digikam features that I would neet