[![Build Status](https://travis-ci.org/NetsBlox/NetsBlox.svg?branch=master)](https://travis-ci.org/NetsBlox/NetsBlox)
[![Stories in Ready](https://img.shields.io/waffle/label/netsblox/netsblox/ready.svg)](http://waffle.io/NetsBlox/NetsBlox)
[![Join the chat at https://gitter.im/NetsBlox/NetsBlox](https://badges.gitter.im/NetsBlox/NetsBlox.svg)](https://gitter.im/NetsBlox/NetsBlox?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
# NetsBlox
NetsBlox is a visual programming language which allows people to develop networked programs.

## Overview
Netsblox is an extension of _Snap!_ which allows users to use some distributed systems principles and develop networked apps. That is, users can create apps that can interact with other instances of Netsblox.

Currently, we have support for networked _events_ and _messages_ where a message is like an event except contains some additional information. For example, in the Tic-Tac-Toe example, the user is able to  create a "TicTacToe" message which contains the row and column that the user played in.

Along with the events and messages, we also currently support _remote procedure calls_. RPC's are implemented as REST endpoints on the server which can perform some of the more challenging computation for the student (allowing support to make more complicated apps) as well as providing access to extra utilities not otherwise available to the student.

For example, if you import the `map-utilities` RPC blocks which gives the user access to Google Maps with a `map of (latitude), (longitude) with zoom (zoom)` block:

![Remote Procedure Returning a Costume](./map-blocks.png)

This results in the stage costume changing:

![Google map costume on the stage](./map-example.png)

## Installation
Before installing, NetsBlox requires [nodejs](https://nodejs.org/en/) (>= v4.0.0) and a [MongoDB](https://www.mongodb.com/download-center?jmp=nav#community) database. By default, NetsBlox will expect MongoDB to be running locally (this can be changed by setting the `MONGO_URI` environment variable).

First clone the repository and install the dependencies.
```
git clone https://github.com/NetsBlox/NetsBlox.git
cd NetsBlox
npm install
```
Finally, start the server with `npm start` and navigate to `localhost:8080` in a web browser to try it out!

## RPC Support
RPCs that are using 3rd party API's often require getting an API key from the given 3rd party API. After obtaining a key, the appropriate environment variable should be set to given key value:

### Required Environment Variables for RPCs
- Maps
  - `GOOGLE_MAPS_KEY` should be set to an API key from the [Google Static Maps](https://developers.google.com/maps/documentation/static-maps/)
- Air Quality
  - `AIR_NOW_KEY` should be set to an API key from [AirNow](https://airnow.gov/)
- Weather
  - `OPEN_WEATHER_MAP_KEY` should be set to an API key from [OpenWeatherMap](http://openweathermap.org/api)
- NASA
  - `NASA_KEY` should be set to an API key from [NASA](https://api.nasa.gov/)
- Traffic
  - `BING_TRAFFIC_KEY` should be set to an API key from [Bing Traffic](https://msdn.microsoft.com/en-us/library/hh441725.aspx)
- Twitter
  - `TWITTER_BEARER_TOKEN` should be set to an API key from Twitter

To simplify this process (and to keep your `~/.bashrc` clean), these values can be stored in a `.env` file in the project root directory and they will be loaded into the environment on starting NetsBlox.

## Examples
After opening the browser, click the `file` button in the top left and click on `Examples` to check out some example networked apps!
