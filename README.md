## Multi-provider email-service
A node application that provides an abstraction for sending emails using a variety of providers such as Amazon SES, Mailgun, SendGrid, etc.

The service provides an abstraction between different email service providers. If one of the services goes down, the service can quickly failover to a different provider without affecting customers.

Example Email Providers:
1. SendGrid - [Documentation](https://sendgrid.com/docs/API_Reference/Web_API/mail.html)
2. Mailgun - [Documentation](http://documentation.mailgun.com/quickstart.html#sending-messages)
3. Amazon SES - [Documentation](http://docs.aws.amazon.com/ses/latest/APIReference/API_SendEmail.html)

#### Service Structure
The service is essentially split in 3 main parts:
1. An enpoint where users can POST data to send emails
2. A Redis queue to create emailJobs that represent the data received on STEP 1
3. A worker that runs and consumes jobs from the queue, and dispatch emails using the providers

The implementation details are discussed in the sessions below.

#### How to run it
##### Requirements
**Node.js** - The version used in this project was 10.1.0. You may be able to test using older Node.js versions.
**Redis** - You need to have a Redis instance running in order to be able to use this service. You can set the connection details in your config file.
**Private Keys** - You need private keys from the email providers you want to use. Check the providers documentation above to find out how to get your own private keys and then put them in your config file.

##### Steps to run it locally or in your server
1. Clone the repository
2. Run `npm install` to install the dependencies
3. Optionally run `npm test` (Note: make sure to create a test.json under the configs folder). You can also simply run `mocha` if you want to run the tests using the `development.json` config file.
4. Create your test files. Usually you will need a `developement.json`, a `test.json` and/or a `production.json`.
5. Start your redis 
6. Start the service with `NODE_ENV=development node app.js`or `NODE_ENV=development pm2 app.js` (Locally you can simply run `npm start` and the default config will point to development.json)

Your service should be up and running now. You can use it by making a POST request as follows:
``` 
curl -X POST \
  http://localhost:8345/email \
  -H 'Content-Type: application/json' \
  -d '{
    "to": ["someone@gmail.com", "someone_else@gmail.com"],
    "subject": "Subject",
    "message": "Hello, this is a test"
}'
```

You can optionally add a `CC` and a `BCC` field in your request:
``` 
curl -X POST \
  http://localhost:8345/email \
  -H 'Content-Type: application/json' \
  -d '{
    "to": ["someone@gmail.com", "someone_else@gmail.com"],
    "cc": ["someone_cc@gmail.com"],
    "bcc": ["someone_bcc@gmail.com"],
    "subject": "Subject",
    "message": "Hello, this is a test"
}'
```

#### Implementation details
This session describes in more details some of the implementation details and architectural decisions for the service.

##### Input validation
This service uses input validation at a request level, i.e., if your POST request is invalid, the service won't even try to make a request to the email providers. In that scenario, you will receive an error `400 - Bad request` with an error a message, and potentially details of why your request failed. An example can be seen below for a request that is made using an invalid email.

###### Request:
```curl -X POST \
  http://localhost:8345/email \
  -H 'Content-Type: application/json' \
  -d '{
    "to": ["invalid-email"],
    "subject": "Subject",
    "message": "Hello, this is a test"
}'
```
###### Response:
```json 
{
    "code": 400,
    "message": "Bad request",
    "details": [
        {
            "path": "body.to[0]",
            "value": "invalid-email",
            "message": "should be a valid email address"
        }
    ]
}
```

##### Redis connection validation

The service requires Redis to run. The startup script will automatically end the service if a connection can't be stablished at the startup time.

#### Architectural decisions

##### Requests
If you make a POST request to the `/email` endpoint, your email may not be sent immediatelly. Instead, it will be put into a Redis queue to be processed in a later moment. A successful request will return you a response with a code `202 - Accepted`. And a body like that:
```json
{
    "code":202,
    "message":"Your email has been queued and will be sent shortly"
}
```
This means that your POST data have been converted into an emailJob and it has been stored into the Redis queue.

##### Redis queue
The queue implemented in this service is a simple FIFO (First In, First Out). Everytime a POST request is made to `/email` the controller will format the POST data and send it to a job-manager process that will push this to the queue using the `rpush` redis command.

##### Worker
When the service initializes a worker is created to process the Redis queue. The worker consists of a `setInterval` process that controls the email dispatching process. The cycle/pseudocode of the worker is the following
```
    setCurrentDispatcher()
    while(true)
        pickUpEmailJob()
        dispatchEmailUsingCurrentProvider()
            if(err)
                putEmailJobBackInTheQueue()    
                incrementErrorCounter()
                if(errorCounter > max_errors)
                    changeCurrentProvider()
            else()
                if(errorCounter > 0)
                    discountError()
                    
```
The worker starts by defining one provider as the current dispatching mechanism. After setting up the dispatcher, the workers starts to pick up jobs from the queue. It will pick one job at a time and send it to the email provider. If this process is successfull, the worker will pick up the next emailJob and continue with the dispatching. If the provider returns an error, the worker will put the job back into the queue and increment an error counter for this provider. The worker will pick up the next email job and try again with the same provider. If there's another error, the worker will again put the emailJob back into the queue and again increment the error counter. If the error counter reaches a limit (defined by you in the config file) the worker will change the dispatching provider to the next one available. Only one error from a provider is not enough to make the worker change the provider (*Unless you configure the maxErrors to 1*). That is to prevent excessive changes of provider for potentially non mission critical errors. If there is an error from a provider followed by consecutive successes the error counter will diminish to a minimum of zero. So, only in the case of **X** consecutive or too frequent errors the worker will change the provider.

One assumption was made while implementing the worker, and that is that there is no preference among which provider to use. As long as they can deliver the emails, the service can use any of them interchangeably.

That wouldn't be hard to change though. The way that the worker was implemented allow us to easily migrate the provider changing heuristic to something more robust. We could potentially have a *master* provider and some *slave* ones, in that scenario the worker could prefer one provider, and in case of errors, we could put it to **_sleep_** for incremental amounts of time until the provider is responsive again. 

Another possibility that the worker implementation allow is having multiple workers running in parallel, each one of them using a different provider, and consuming from the same email queue. In this scenario, we could also have a **_sleep_** mechanism in case of multiple errors from one providers. While the erroring one sleeps, the others continue to consume the queue and dispatch emails.

##### Data loss
The data loss prevention is provided by the combination of the worker and the Redis queue. I.e, if we try to send an email with one provider and that fails, we still hold the emailData internally in our service, so we can put it back to the Redis queue and try again later. The reliability of Redis in this scenario would be incredibly high, but if we want to be extremelly cautious with data loss, we could also implement a fallback/backup database to hold the emailJobs. That way, if for some reason we can't put a job into the redis queue we could fallback to a secondary databases that the workers could also consume from.

##### Slow responses from providers
The service allows you to configure a custom timeout limit for the requests that are made to the providers. Let's say you set that limit to 5 seconds. Every time the service gets a timeout from a provider, this would be considered as an error for the worker and the error counter would be incremented. Receive **X** timeouts, and the worker would automatically change the provider to the next one available.


