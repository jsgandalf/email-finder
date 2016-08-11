
Ubuntu applications you will need to install (because phantomJS requires it):

sudo apt-get install libfontconfig

To test the simulatenous:

./simultaneousRequests.sh "http://localhost:3000/api/v1/guess?key=UZE6pY5Yz6z3ektV:NEgYhceNtJaee3ga:H5TYvG57F2dzJF7G&first=jimmy&last=dean&domain=godaddy.com" 50
