const Message = require("discord.js").Structures.get('Message');
const ButtonCollector = require('./ButtonCollector');
const APIMessage = require('./APIMessage').APIMessage;
const BaseMessageComponent = require('./interfaces/BaseMessageComponent');

class ExtendedMessage extends Message {

    _patch(data) {
        super._patch(data);
        this.components = (data.components || []).map(c => BaseMessageComponent.create(c, this.client));
        return this;
    }

    createButtonCollector(filter, options = {}) {
        return new ButtonCollector(this, filter, options);
    }

    awaitButtons(filter, options = {}) {
        return new Promise((resolve, reject) => {
            const collector = this.createButtonCollector(filter, options);
            collector.once('end', (buttons, reason) => {
                if (options.errors && options.errors.includes(reason)) {
                    reject(buttons);
                } else {
                    resolve(buttons);
                }
            });
        })
    }

    reply(content, options) {
        return this.channel.send(
            content instanceof APIMessage
                ? content
                : APIMessage.transformOptions(content, options, { reply: this.member || this.author }),
        );
    }

    edit(content, options = {}) {
        if (this.components.length > 0 && options !== null && options.component === undefined && options.components === undefined) {
            options.components = this.components.map(c => BaseMessageComponent.create(c, this.client));
        }
        const { data } =
            content instanceof APIMessage ? content.resolveData() : APIMessage.create(this, content, options).resolveData();
        return this.client.api.channels[this.channel.id].messages[this.id].patch({ data }).then(d => {
            const clone = this._clone();
            clone._patch(d);
            return clone;
        });
    }

}

module.exports = ExtendedMessage;