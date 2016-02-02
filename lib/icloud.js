import uuid from 'node-uuid'
import https from 'https'

module.exports = class iCloud {
    constructor() {
        if (!process.env['APPLEID'] || !process.env['APPLEPASSWORD']) {
            throw new Error('Please set environment variables for AppleID and password.')
        }
        this.loginData = JSON.stringify({
            apple_id: process.env['APPLEID'],
            password: process.env['APPLEPASSWORD'],
            extended_login: false
        })
        this.clientBuildNumber = '1P24';
        this.clientId = uuid.v1().toString().toUpperCase()
        this.cookie = null
        this.urls = {
            version : 'https://www.icloud.com/system/version.json',
            validate: `/setup/ws/1/validate?clientBuildNumber=${this.clientBuildNumber}&clientId=${this.clientId}`,
            login: `/setup/ws/1/login?clientBuildNumber=${this.clientBuildNumber}&clientId=${this.clientId}`
        }
        this.USERAGENT = `Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.114 Safari/537.36`
        this.sessionOptions = {
          host: 'p12-setup.icloud.com',
          path: this.urls.login,
          method: 'POST',
          headers: {
            'Origin': 'https://www.icloud.com',
            'Referer': 'https://www.icloud.com',
            'User-Agent': this.USERAGENT
          }
        };
    }
    _session() {
        return new Promise(resolve => {
            let request = https.request(this.sessionOptions, response => {
                if (response.headers['set-cookie']) {
                    this.cookie = response.headers['set-cookie']
                }
                let buffer = ''

                response.on('data', data => {
                    buffer += data
                })

                response.on('end', () => {
                    resolve(JSON.parse(buffer))
                })

                response.on('error', error => {
                    console.log('Error at Session layer: ', error)
                })
            })
            request.write(this.loginData)
            request.end()
        })
    }

    _webservice() {
        return new Promise(resolve => {
            let fmfUrl = `/fmipservice/client/fmfWeb/initClient?clientBuildNumber=${this.clientBuildNumber}&clientId=${this.clientId}&dsid=${this.session.dsInfo.dsid}`

            let webserviceOptions = {
              host: this.session.webservices.fmf.url
                .replace('https://', '')
                .replace(':443', ''),
              path: fmfUrl,
              method: 'POST',
              headers: {
                'Origin': 'https://www.icloud.com',
                'Referer': 'https://www.icloud.com',
                'Cookie': this.cookie.join('; '),
                'User-Agent': this.USERAGENT
              }
            }
            let webservicePayload = {
                dataContext: null,
                serverContext: null,
                clientContext: {
                    productType: 'fmfWeb',
                    appVersion:'1.0',
                    contextApp: 'com.icloud.web.fmf',
                    userInactivityTimeInMS: 537,
                    windowInFocus: false,
                    windowVisible: true,
                    mapkitAvailable: true,
                    tileServer: 'Apple'
                }
            }

            let request = https.request(webserviceOptions, response => {
                let buffer = ''

                response.on('data', data => {
                    buffer += data
                })

                response.on('end', () => {
                    resolve(JSON.parse(buffer))
                })

                response.on('error', error => {
                    console.log('Error at Webservice layer: ', error)
                })
            })

            request.write(JSON.stringify(webservicePayload))
            request.end()
        })
    }

    login() {
        return this._session().then(session => {
            this.session = session
            return this._webservice()
        }).then(webservices => {
            this.webservices = webservices
            return this.webservices
        })
    }

    getLocations() {
        return this.webservices.locations
    }

    getLocationByEmail(email) {
        var person = this.webservices.following.find(person => {
            return person.invitationSentToEmail === email
        })

        if (!person) {
            return false
        }

        return this.webservices.locations.find(location => {
            return location.id === person.id
        })
    }
}
