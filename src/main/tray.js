const { Tray, Menu, app, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

var tray = null;

function createTray(mainWindow) {
  var iconPath = path.join(__dirname, '..', '..', 'assets', 'icon.png');
  var icon;

  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) icon = null;
  } catch {
    icon = null;
  }

  if (!icon) {
    var rgbaPath = path.join(__dirname, '..', '..', 'assets', 'icon.rgba');
    try {
      var rgba = fs.readFileSync(rgbaPath);
      icon = nativeImage.createFromBuffer(rgba, { width: 16, height: 16 });
    } catch {
      // Fallback: tiny 1x1 transparent
      icon = nativeImage.createEmpty();
    }
  }

  tray = new Tray(icon);
  tray.setToolTip('icanhelp');

  var contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open',
      click: function () {
        mainWindow.show();
        mainWindow.focus();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: function () { app.quit(); },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', function () {
    mainWindow.show();
    mainWindow.focus();
  });

  return tray;
}

module.exports = { createTray };
