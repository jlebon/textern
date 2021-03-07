/* vim: set et ts=4 tw=92:
 * Copyright (C) 2017-2018  Jonathan Lebon <jonathan@jlebon.com>
 * This file is part of Textern.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

"use strict";

function onError(error) {
    console.log(`Error: ${error}`);
}

function saveOptions(e) {
    e.preventDefault();
    kill_editors_allow = document.querySelector("#kill_editors_allow").checked;
    if (kill_editors_allow) {
        kill_editors_timeout = document.querySelector("#kill_editors_timeout").value;
        if (kill_editors_timeout.length > 0) {
            kill_editors_timeout = parseInt(kill_editors_timeout);
           // Check for NaN
            if (kill_editors_timeout !== kill_editors_timeout) {
                kill_editors_timeout = 1;
            }
        }
    } else {
        kill_editors_timeout = 1;
    }
    browser.storage.local.set({
        editor: document.querySelector("#editor").value,
        shortcut: document.querySelector("#shortcut").value,
        extension: document.querySelector("#extension").value,
        backupdir: document.querySelector("#backupdir").value,
        kill_editors_allow: kill_editors_allow,
        kill_editors_timeout: kill_editors_timeout
    });
    document.querySelector("#saved").innerHTML = '\u2713';
}

function clearCheckmark(e) {
    document.querySelector("#saved").innerHTML = "";
}

function restoreOptions() {

    browser.storage.local.get("editor").then(result => {
        document.querySelector("#editor").value =
            result.editor || "[\"gedit\", \"+%l:%c\"]";
    }, onError);

    browser.storage.local.get("shortcut").then(result => {
        document.querySelector("#shortcut").value = result.shortcut || "Ctrl+Shift+D";
    }, onError);

    browser.storage.local.get("extension").then(result => {
        document.querySelector("#extension").value = result.extension || "txt";
    }, onError);

    browser.storage.local.get("backupdir").then(result => {
        document.querySelector("#backupdir").value = result.backupdir || "";
    }, onError);

    browser.storage.local.get("kill_editors_allow").then(result => {
        document.querySelector("#kill_editors_allow").checked = result.kill_editors_allow || false;
    }, onError);

    browser.storage.local.get("kill_editors_timeout").then(result => {
        document.querySelector("#kill_editors_timeout").value = result.kill_editors_timeout || '';
    }, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
document.querySelectorAll("form > input").forEach(
    function(value, key, listObj, argument) {
        value.addEventListener("input", clearCheckmark);
    }
)
