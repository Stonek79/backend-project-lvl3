### Hexlet tests and linter status:
[![Actions Status](https://github.com/Stonek79/backend-project-lvl3/workflows/hexlet-check/badge.svg)](https://github.com/Stonek79/backend-project-lvl3/actions)

***
[![Maintainability](https://api.codeclimate.com/v1/badges/a99a88d28ad37a79dbf6/maintainability)](https://codeclimate.com/github/Stonek79/backend-project-lvl3)
[![Test Coverage](https://api.codeclimate.com/v1/badges/a99a88d28ad37a79dbf6/test_coverage)](https://codeclimate.com/github/Stonek79/backend-project-lvl3)
[![WF](https://github.com/Stonek79/backend-project-lvl3/workflows/PageLoader/badge.svg)](https://github.com/Stonek79/backend-project-lvl3)
***

# Page Loader 

### **Page Loader** - a simple command-line utility for downloading and saving web page on your PC.

**Page Loader** is the third project of the profession [*back-end programmer*](https://ru.hexlet.io/programs/backend) on educational project [**Hexlet**](https://ru.hexlet.io/).

## Installation

You must have [**node.js**](https://nodejs.org/en/) installed on your machine (version 14.0 or higher).

Open your console and enter the commands:

 $ user@name: git clone https://github.com/Stonek79/backend-project-lvl3.git

Then find and go to the folder ../backend-project-lvl3/ on your machine and launch installation:

 $ user@name: make install


* * *

## Usage

The command use this syntax:

    page-loder [dir] url
    page-loader  <download directory> <web page address>

example:

    page-loader -o /home/username/dirname https://exemple.com
    (page will be loaded to /home/username/dirname)

or

    page-loader https://exemple.com
    (page will be loaded to ../backend-project-lvl3/)


By default (if you don't enter dir name to command line) the page will be loded into the **Page Loader** directory

If you need help, use the `help` command:

    page-loader --help
    
Here is the exemples of usage:

    user@user:~/backend-project-lvl3$ page-loader -o /home/user/dirname https://martinfowler.com
    ✔ Сreating directory: martinfowler-com_files
    ✔ Loading resource: https://martinfowler.com/home.css
    ✔ Loading resource: https://martinfowler.com/mf-name-white.png
    ✔ Loading resource: https://martinfowler.com/img/mf-dallas.jpg
    ✔ Loading resource: https://martinfowler.com/photos/125.jpg
    ✔ Loading resource: https://martinfowler.com/architecture/oscon.png
    ✔ Loading resource: https://martinfowler.com/board-games.png
    ✔ Loading resource: https://martinfowler.com/articles/patterns-of-distributed-systems/card.png
    ✔ Loading resource: https://martinfowler.com/articles/platform-prerequisites/card.png
    ✔ Loading resource: https://martinfowler.com/articles/bitemporal-history/card.png
    ✔ Loading resource: https://martinfowler.com/tw-white-300.png
    ✔ Loading resource: https://martinfowler.com/jquery-1.11.3.min.js
    ✔ Loading resource: https://martinfowler.com/mfcom.js
    ✔ Сreating htmlFile: martinfowler-com.html
    Page was downloaded to '/home/user/dirname/martinfowler-com.html'

    
### Example of use:
[![Example of use](https://asciinema.org/a/qda7KpzPSei8H0bVlmZQNzfqC.svg)](https://asciinema.org/a/qda7KpzPSei8H0bVlmZQNzfqC)

### Example of programm errors:
[![Exemple of programm errors](https://asciinema.org/a/j9qx3biyledIy7c5wutwWlF3O.svg)](https://asciinema.org/a/j9qx3biyledIy7c5wutwWlF3O)

### Example of debug:
Program debug
[![Program debug](https://asciinema.org/a/TMUmiMvZ3eAWKWh1nFujzg8jM.svg)](https://asciinema.org/a/TMUmiMvZ3eAWKWh1nFujzg8jM)

Tests debug
[![Tests debug](https://asciinema.org/a/HaWrDYRaDZr2KquokXmD6yjUe.svg)](https://asciinema.org/a/HaWrDYRaDZr2KquokXmD6yjUe)
