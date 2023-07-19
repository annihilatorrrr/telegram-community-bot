# **FirmaChain Official Telegram Group Bot**
![firmachain official bot](https://user-images.githubusercontent.com/93503020/163318773-268e9605-5e9f-4004-b2fa-0a3c05b7545c.png)

<br/>

## **Overview**
This project implements a bot for managing the 'FirmaChain Global Official' Telegram group.

<br/>

## **Features**
The bot immediately kicks out any new bots that join the chat room, temporarily restricts all rights of new users, and sends a message button for restoring these rights. Users have to click the button within 3 minutes, otherwise the message will be automatically deleted. When the button is clicked, a welcome message is sent to the user, and each time a new user clicks the button, the most recent welcome message is deleted and a new welcome message is sent.

This project uses a separate scheduler process. The scheduler automatically deletes the message 3 minutes later if the user does not click the button to restore rights.

<br/>

## **Environment Setup**
To set up the environment, you first need to copy the .env.sample file to .env.production and set appropriate values for each environment variable.
```bash
# File copy
$ cp .env.sample .env.production
```
- `PORT`: Specifies the port on which the server will run (e.g. 3000).

- `TOKEN`: Specifies the token value of the bot.

- `GROUP_CHAT_ID`: Specifies the ID of the Telegram group chat to be managed.

- `RESTRICT_DELETE_TIME`: Specifies the time in minutes to delete the message after setting the restriction (e.g. 3).

- `RESTRICT_FILE_PATH`: Specifies the path of the file where the restriction message is stored (e.g. public/your_restrict_filename.json).

- `NOTICE_FILE_PATH`: Specifies the path of the file where the notice message is stored (e.g. public/your_notice_filename.json).

<br/>

## **Build Method**
```bash
# Clone repository
$ git clone https://github.com/FirmaChain/telegram-community-bot.git

# Move to project folder
$ cd telegram-community-bot

# Install necessary packages
$ npm install

# Copy .env.sample file to .env.production
$ cp .env.sample .env.production

# Run server
$ npm run start
```

In the state where the server is running, the scheduler must be run separately. The scheduler is set to run every minute.
```bash
# Run scheduler
$ npm run start:scheduler
```