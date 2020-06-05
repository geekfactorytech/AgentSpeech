$(document).ready(function () {
    app.initialized()
        .then(function (_client) {
            var client = _client;
            let reply = (no, command) => {
                let replyText = command.split('with');
                requestApi({
                    url: `tickets/${no}/reply`,
                    method: "post",
                    body: { "body": `${replyText[1]}` }
                }).then(function () {
                    client.interface.trigger("showNotify", {
                        type: "success", title: "",
                        message: "Replied successfully"
                    })
                }).catch()
            }
            let getTicket = (number) => {
                console.log({ number })
                requestApi({
                    url: `tickets/${number}?include=conversations`,
                    method: "get"
                }).then(function (data) {
                    let id = data.id, subject = data.subject, description = data.description_text, conversations = data.conversations;
                    $('#list').addClass('hide');
                    $('.singleTicket').removeClass('hide');
                    let conText = '';
                    conversations.forEach(element => {
                        conText += `<div class="conv"  class="">
                        ${element.body_text}</div>`
                    });
                    let convBody = `<div class="border-block"><fw-tabs>
                    <fw-tab tab-header=${id}>
                         <h5>Subject</h5>
                         <div class="conv">${subject}</div>
                         <h5>Description</h5>
                         <div class="conv">${description}</div>
                     </fw-tab>
                     <fw-tab tab-header="Conversation">${conText}
                     </fw-tab> </fw-tabs></div>`
                    $('.singleTicket').html(convBody);
                })
            }
            let requestApi = function (options) {
                return new Promise((resolve, reject) => {
                    var opt = {
                        headers: {
                            "Authorization": "Basic <%= encode(iparam.apiKey) %>",
                            "Content-Type": "application/json; charset=utf-8"
                        }
                    };
                    if ('body' in options) {
                        opt['body'] = JSON.stringify(options.body);
                    }
                    var url = 'https://<%= iparam.domain %>.freshdesk.com/api/v2/' + options.url;
                    client.request[options.method](url, opt).then(function (data) {
                        resolve(JSON.parse(data.response));
                    }).catch(reject);
                });
            }
            let priority = (command) => {
                let priority = command.toLowerCase().split('priority'),
                    pri = { 'low': 1, 'medium': 2, 'high': 3, 'urgent': 4 }, val = priority[0].toString().trim(),
                    html = ''
                requestApi({
                    url: `search/tickets?query="priority:${pri[val]}"`,
                    method: "get"
                }).then(function (allTicket) {
                    $('.singleTicket').addClass('hide');
                    allTicket.results.forEach(ele => {
                        getConversation(ele).then(function (conv) {
                            let convText = '';
                            conv.data.forEach(j => {
                                convText += `<div>${j.body_text}
                           </div>`
                            })
                            html = `<div class="border-block"><fw-tabs>
                            <fw-tab tab-header=${ele.id}>
                                 <h5>Subject</h5>
                                 <div>${ele.subject}</div>
                                 <h5>Description</h5>
                                 <div>${ele.description}</div>
                             </fw-tab>
                             <fw-tab tab-header="Conversation">${convText}</fw-tab ></fw-tabs ></div>`
                            $('#list').append(html).removeClass('hide')
                        }).catch(function (e) {
                            console.error("Error");
                            console.error(e)
                        })
                        html = '';
                    });
                })
            }
            let getConversation = (ele) => {
                return new Promise((resolve, reject) => {
                    requestApi({
                        url: `tickets/${ele.id}/conversations`,
                        method: "get"
                    }).then(function (data) {
                        resolve({ data })
                    }).catch(reject)
                })
            }
            let checkOtherCommands = (command) => {
                if (command.toLowerCase().includes('priority')) {
                    $('#details').text(command);
                    priority(command);
                } else if (command.toLowerCase().includes('note')) {
                    let val = command.toLowerCase().split('note'),
                        noteType = val[0],
                        ticketnumber = val[1];
                    addNote(noteType, ticketnumber, command)
                }
            }
            let addNote = (type, number, command) => {
                let flag = type == 'private' ? false : true,
                    noteText = command.split('with');
                console.log(flag);
                requestApi({
                    url: `tickets/${number}/notes`,
                    method: "post",
                    body: { "private": flag, "body": `${noteText[1]}` }
                }).then(function () {
                    client.interface.trigger("showNotify", {
                        type: "success", title: "",
                        message: "Note added successfully"
                    })
                }).catch(function (e) {
                    console.error("Error");
                    console.error(e)
                })
            }
            var message = document.querySelector('#message');
            var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
            var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
            var grammer = '#JSGF v1.0';
            var recognition = new SpeechRecognition();
            var SpeechRecognitionGrammerList = new SpeechGrammarList();
            SpeechRecognitionGrammerList.addFromString(grammer, 1);
            recognition.grammers = SpeechRecognitionGrammerList;
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.onresult = function (event) {
                var last = event.results.length - 1;
                var command = event.results[last][0].transcript;
                if (command.toLowerCase().startsWith('get ticket')) {
                    $('#details').text(command);
                    let number = command.match(/\d+/)[0];
                    getTicket(number)
                } else if (command.toLowerCase().startsWith('reply')) {
                    $('#details').text(command);
                    let ticketNo = command.match(/\d+/)[0];
                    reply(ticketNo, command)
                } else {
                    checkOtherCommands(command)
                    $('#apptext').val(' ' + command)
                }
            }
            recognition.onspeechend = function () {
                recognition.stop();
            }
            recognition.onerror = function () {
                message.textContent = 'Error occurred in recognition' + event.error;
            }
            document.querySelector('#btnGiveCommand').addEventListener('click', function () {
                recognition.start()
            })
            document.querySelector('#ticket').addEventListener('click', function () {
                recognition.start()
            });
            document.querySelector('#apply').addEventListener('click', function () {
                let text = $('#apptext').val();
                client.interface.trigger("setValue", { id: "editor", text: `${text}`, replace: false, position: "end" })
                    .then(function () {
                        client.instance.close();
                    }).catch(function (error) {
                        console.error("Error")
                        console.error(error)
                    });

            })

        });


});

