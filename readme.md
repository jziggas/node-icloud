# node-icloud
## A NodeJS iCloud client. Find your friends for fun and profit.

# Usage

First set up some environment variables.

```
> export APPLEID="MYAPPLEID"
> export APPLEPASSWORD="MYAPPLEPASSWORD"
```

Then do something like:

```
let icloud = new iCloud()

icloud.login().then(() => {
    console.log(icloud.getLocations())
    console.log(icloud.getLocationByEmail('mybuddy@gmail.com'))
})
