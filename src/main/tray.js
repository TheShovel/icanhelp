const { Tray, Menu, app, nativeImage } = require("electron");
const path = require("path");

var tray = null;

function createTray(mainWindow) {
  var iconPath = path.join(
    __dirname,
    "..",
    "..",
    "assets",
    "buddyArt",
    "idle.png",
  );
  var icon;

  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) icon = null;
  } catch {
    icon = null;
  }

  if (!icon) {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip("Canhelpy");

  var contextMenu = Menu.buildFromTemplate([
    {
      label: "Open",
      click: function () {
        mainWindow.show();
        mainWindow.focus();
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: function () {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on("click", function () {
    mainWindow.show();
    mainWindow.focus();
  });

  return tray;
}

module.exports = { createTray };
