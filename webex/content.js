/* vim: set et ts=4 tw=92:
 *
 * Copyright (C) 2017 Jonathan Lebon
 *
 * This file is part of Textern.
 * Textern is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Textern is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Textern.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

var elements = new Map(); /* id --> e */

function watchElement(e) {
    /* these are IDs we assign ourselves, unrelated to its DOM id */
    if (!("texternId" in e))
        e.texternId = elements.size;
    elements.set(e.texternId, e);
    return e.texternId;
}

function getText(respond) {
    var e = document.activeElement;
    if (e.nodeName == "TEXTAREA") {
        var id = watchElement(e);
        /* don't use href directly to not bring in e.g. url params */
        var simple_url = window.location.hostname + window.location.pathname
        respond({id: id, text: e.value, url: simple_url});
    }
}

function rgb(r, g, b) {
    return 'rgb(' + ([r, g, b].join()) + ')';
}

const ANIMATION_DURATION_S = 500.0;
const ANIMATION_N_STEPS = 10;

function fadeBackground(e) {
    if ("texternOrigBackgroundColor" in e)
        return; /* if there's already an animation in progress, don't start a new one */
    e.texternOrigBackgroundColor = e.style.backgroundColor;
    e.style.backgroundColor = rgb(255, 255, 0);
    var i = 0;
    var timerId = window.setInterval(function() {
        if (i < ANIMATION_N_STEPS) {
            e.style.backgroundColor = rgb(255, 255, i*(255/ANIMATION_N_STEPS));
            i++;
        } else {
            e.style.backgroundColor = e.texternOrigBackgroundColor;
            delete e.texternOrigBackgroundColor;
            window.clearInterval(timerId);
        }
    }, ANIMATION_DURATION_S / ANIMATION_N_STEPS);
}

function setText(id, text) {
    var e = elements.get(id);
    e.value = text;
    fadeBackground(e);
}

function onMessage(message, sender, respond) {
    if (sender.id != "textern@jlebon.com")
        return;
    if (message.type == "get_text")
        getText(respond);
    else if (message.type == "set_text")
        setText(message.id, message.text);
    else
        console.log(`Unknown type: ${message.type}`);
}

browser.runtime.onMessage.addListener(onMessage);
