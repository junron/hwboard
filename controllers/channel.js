const xss = require("xss");
const {Sequelize,Channels/*,Homework*/} = require("../models");

async function editChannel(channelName, newChannelName) {
  channelName = xss(channelName);
  const channels = await Channels.find({
    raw: true,
    where: {name: channelName}
  });

  if(typeof channels==="undefined"){
    throw new Error("Channel doesn't exist");
  }

  channels.name = xss(newChannelName);
  return Channels.update(channels,
    {
      where:{
        id:channels.id
      }
    });
}

async function deleteChannel(channelName) {
  channelName = xss(channelName);
  const channels = await Channels.find({
    raw: true,
    where: {name: channelName}
  });

  if(typeof channels==="undefined"){
    throw new Error("Channel doesn't exist");
  }

  await channels.destroy();
  return Sequelize.dropTable("homework-"+channelName);
}

module.exports = {
  editChannel,
  deleteChannel
};