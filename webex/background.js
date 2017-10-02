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

var port = undefined;

var activeDocs = [];

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

function contentSetActiveText(tid, eid, text) {
    var sender = browser.tabs.sendMessage(tid, {type: "set_text", id: eid, text: text});
    /* XXX: treat this error specially and notify? e.g. if tab was closed */
    sender.then(assertNoResponse, logError);
}

function handleNativeMessage(msg) {
    if (msg.type == "text_update") {
        var [tid, eid] = msg.payload.id.split("_").map(x => { return parseInt(x); });
        if (tid == NaN || eid == NaN) {
            console.log(`Invalid id: ${id}`);
            return;
        }
        contentSetActiveText(tid, eid, msg.payload.text);
    } else if (msg.type == "death_notice") {
        unregisterDoc(msg.payload.id);
    } else if (msg.type == "error") {
        notifyError(msg.payload.error);
    } else {
        console.log(`Unknown native message type: ${msg.type}`);
    }
}

function unregisterDoc(id) {

    var i = activeDocs.indexOf(id);
    if (i == -1) {
        console.log(`Error: document id ${id} isn't being edited`);
        return;
    }

    activeDocs.splice(i, 1);
    if (activeDocs.length == 0) {
        port.disconnect();
        port = undefined;
    }
}

function registerDoc(tid, eid, text, url) {

    var id = `${tid}_${eid}`;
    if (activeDocs.indexOf(id) != -1) {
        console.log(`Error: document id ${id} is already being edited`);
        notifyError("this text is already being edited");
        return;
    }

    activeDocs.push(id);
    if (port == undefined) {
        port = browser.runtime.connectNative("textern");
        port.onMessage.addListener((response) => {
            handleNativeMessage(response);
        });
    }

    browser.storage.local.get({
        editor: "[\"gedit\"]",
        extension: "txt"
    }).then(values => {
        port.postMessage({
            type: "new_text",
            payload: {
                id: id,
                text: text,
                url: url,
                prefs: {
                    editor: values.editor || "[\"gedit\"]",
                    extension: values.extension || "txt"
                }
            }
        });
    }, logError);
}

function handleRegisterText(tabId, message) {
    registerDoc(tabId, message.id, message.text, message.url);
}

function onMessage(message, sender, respond) {
    if (sender.id != "textern@jlebon.com")
        return;
    var tabId = sender.tab.id;
    if (message.type == "register_text")
        handleRegisterText(tabId, message);
    else
        console.log(`Unknown message type: ${message.type}`);
}

browser.runtime.onMessage.addListener(onMessage);
