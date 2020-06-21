/* vim: set et ts=4 tw=92:
 * Copyright (C) 2017-2018  Jonathan Lebon <jonathan@jlebon.com>
 * This file is part of Textern.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

"use strict";

var elements = new Map(); /* id --> e */

function logError(error) {
    console.log(`Error: ${error}`);
}

function assertNoResponse(response) {
    console.assert(response == undefined);
}

function notifyError(error) {
    browser.notifications.create({
        type: "basic",
        title: "Textern",
        message: "Error: " + error + "."
    });
}

function watchElement(e) {
    /* these are IDs we assign ourselves, unrelated to its DOM id */
    if (!("texternId" in e))
        e.texternId = elements.size;
    elements.set(e.texternId, e);
    return e.texternId;
}

/* special hack for Slack: https://github.com/jlebon/textern/issues/61 */
function isSlackMessage(e) {
    return (window.location.hostname.endsWith(".slack.com") &&
            e.classList.contains("ql-editor"));
}

function textFromSlackMessageDiv(e) {
    /* each line is a different <p> element */
    var text = "";
    for (i = 0; i < e.children.length; i++) {
        if (i > 0) {
            text += "\n";
        }
        text += e.children[i].textContent;
    }
    return text;
}

function textToSlackMessageDiv(text) {
    var lines = text.split("\n");
    var html = "";
    for (i = 0; i < lines.length; i++) {
        html += "<p>";
        html += lines[i];
        html += "</p>";
    }
    return html;
}

function registerText(event) {
    var e = event.target;
    if (e.nodeName == "TEXTAREA") {
        var id = watchElement(e);
        /* don't use href directly to not bring in e.g. url params */
        var simple_url = window.location.hostname + window.location.pathname
        browser.runtime.sendMessage("textern@jlebon.com", {
            type: "register_text",
            id: id,
            text: e.value,
            caret: e.selectionStart,
            url: simple_url
        }).then(assertNoResponse, logError);
    } else if ((e.nodeName == "DIV") && e.contentEditable) {
        var id = watchElement(e);
        /* don't use href directly to not bring in e.g. url params */
        var simple_url = window.location.hostname + window.location.pathname
        browser.runtime.sendMessage("textern@jlebon.com", {
            type: "register_text",
            id: id,
            text: isSlackMessage(e) ? textFromSlackMessageDiv(e) : e.innerText,
            caret: 0,
            url: simple_url
        }).then(assertNoResponse, logError);
    } else {
        notifyError("no text field selected");
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
    if (e.nodeName == "TEXTAREA") {
        e.value = text;
    } else if ((e.nodeName == "DIV") && e.contentEditable) {
        if (isSlackMessage(e)) {
            e.innerHTML = textToSlackMessageDiv(text);
        } else {
            e.innerText = text;
        }
    }
    fadeBackground(e);
}

function onMessage(message, sender, respond) {
    if (sender.id != "textern@jlebon.com")
        return;
    if (message.type == "set_text")
        setText(message.id, message.text);
    else {
        console.log(`Unknown message type: ${message.type}`);
    }
}

browser.runtime.onMessage.addListener(onMessage);

var currentShortcut = undefined;
function registerShortcut(force) {
    browser.storage.local.get({shortcut: "Ctrl+Shift+D"}).then(val => {
        if ((val.shortcut == currentShortcut) && !force)
            return; /* no change */
        if (currentShortcut != undefined)
            shortcut.remove(currentShortcut);
        currentShortcut = val.shortcut;
        shortcut.add(currentShortcut, registerText);
    });
}

registerShortcut(true);

/* meh, we just re-apply the shortcut -- XXX: should check what actually changed */
browser.storage.onChanged.addListener(function(changes, areaName) {
    registerShortcut(false);
});

/* we also want to make sure we re-register whenever the number of iframes changes */
var lastNumFrames = window.frames.length;
const observer = new MutationObserver(function() {
    if (window.frames.length != lastNumFrames) {
        registerShortcut(true);
        lastNumFrames = window.frames.length;
    }
});
observer.observe(document, {childList: true, subtree: true});
