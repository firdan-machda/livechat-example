'use client'
import Image from 'next/image'
import styles from './page.module.css'
import { createRef, useEffect, useState } from 'react'
import io from 'socket.io-client'
import Card from '@/components/card'
import Actions from '@/components/actions'
import {
  CSSTransition,
  TransitionGroup,
} from 'react-transition-group';

export default function Home() {
  const [wsInstance, setWsInstance] = useState(null);
  const [messages, setMessages] = useState([])
  const [text, setText] = useState("")
  const [error, setError] = useState(null)
  const [choices, setChoices] = useState([])
  const [delay, setDelay] = useState(0)

  useEffect(() => {
    const objDiv = document.getElementById("messages")
    if (objDiv.children.length > 1) {
      objDiv.children[objDiv.children.length - 1].scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages])


  function establishWebsocket() {
    if (typeof window !== "undefined") {
      let token = localStorage.getItem('token')
      const ws = new WebSocket(`ws://localhost:8000/ws/livechat/test/?token=${token}`)

      ws.onmessage = (e) => {
        console.log("WS", e.data)
        const parsed = JSON.parse(e.data)
        console.log(parsed)
        setMessages(arr => [...arr, parsed])
        // switch (parsed.type) {
        //   case "system":
            
        //     break;
        //   case "action":
        //     setChoices(parsed.choices)
        //     break
        //   default:
        //     setMessages(arr => [...arr, parsed])

        // }
      }
      ws.onopen = (e) => {
        console.log("Connected")
      }
      ws.onclose = (e) => {
        console.log('Disconnected')
      }
      setWsInstance(ws)
    }

  }

  useEffect(() => {
    console.log('call ws')
    establishWebsocket()

    return () => {
      // go to login if token doesn't exist in local storage
      let token = localStorage.getItem(token)
      if (!token){
        router.push('/login')
      }

      // Cleanup on unmount if ws wasn't closed already
      if (!wsInstance){
        return
      }

      if (wsInstance?.readyState !== 3) {
        console.log('call cleanup')
        wsInstance.close()
      }
    }
  }, [])

  function submit() {
    console.log(wsInstance)
    console.log('attempt to send', wsInstance.readyState, text)
    if (text !== "") {
      wsInstance.send(JSON.stringify({ message: text, owner: "client" }))
      setText("")
    }
  }

  function submitCoinFlipAction(e) {
    const answer = e.target.value
    wsInstance.send(JSON.stringify({ message: "coinflip", answer: answer, owner: "client" }))
    setChoices([])

  }

  return (
    <main className="flex flex-col items-center justify-between h-dvh py-2">
      <div className="flex flex-col items-center justify-center w-full">
        <ul id="messages" className="flex flex-col items-start space-y-4">
          <TransitionGroup>
            {
              messages.map((val, index) => {
                const message = val
                let previousMessage;
                if (index > 0) {
                  previousMessage = messages[index - 1]
                }
                const drawAvatar = message.owner == "server" && ((index > 0 && previousMessage.owner !== "server") || index == 0)
                return (
                  <CSSTransition
                    key={index}
                    timeout={1000}
                    classNames={ message.owner == "client" ? "" : "server-message-anim"}
                  >
                    <li key={index} className={styles.message}>
                      <Card
                        message={message.message}
                        avatar={drawAvatar
                          ? <Image src="/media/chatbot.png" width={60} height={60} />
                          : null}
                        userMessage={message.owner == "client"}
                      />
                    </li>
                  </CSSTransition>
                )
              })
            }
            </TransitionGroup>
            <Actions choices={choices} submitAction={submitCoinFlipAction} />
            {
              error && <li>
                {error}
              </li>
            }
        </ul>

      </div>
      <div className="flex items-center space-x-4 mt-8">
        <Image src="/media/user.png" width={60} height={60}></Image>
        <textarea
          value={text}
          id="chat-input"
          placeholder="Type here..."
          className="w-full h-12 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
          onChange={(e) => setText(e.target.value)}
        >
        </textarea>
        <button className={styles.send_button} onClick={submit}><Image src="/media/paper-plane.png" width={60} height={60}></Image></button>
      </div>
    </main>

  )
}
