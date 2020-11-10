module.exports = {
  "bumpFiles": [
    {
      "filename": "setup.py",
      //  See "Custom `updater`s" for more details.
      "updater": "setup-py-updater.js"
    },
    {
        "filename": "package.json",
        "type": "json"
    }
  ]
}
