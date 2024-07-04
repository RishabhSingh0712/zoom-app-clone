import React, { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import ReactPlayer from "react-player"
import peer from "../service/peer";


const Roompage = ()=>{
    const socket = useSocket();
    const [remoteSocketId, setremoteSocketId] = useState(null)
    const [myStream,setmyStream]= useState(null)

    const handleUserJoined = useCallback(({email,id})=>{
        console.log(`Email ${email} joined room`);
        setremoteSocketId(id)

    },[])
    const handleCallUser = useCallback(async()=>{
        const stream = await navigator.mediaDevices.getUserMedia({audio:true,video:true})
        const offer = await peer.getOffer();
        socket.emit("user:call", {to: remoteSocketId,offer})
        setmyStream(stream)
    },[remoteSocketId, socket])

    const handleincommingCall = useCallback(async({from , offer})=>{
        const stream = await navigator.mediaDevices.getUserMedia({audio:true,video:true});
        setmyStream(stream);
        console.log(`incomming call`,from,offer);
        const ans = await peer.getAnswer(offer)
        socket.emit("call:accepted", {to:from,ans})
    },[socket])

    useEffect(()=>{
        socket.on("user:joined",handleUserJoined)
        socket.on('incomming call',handleincommingCall)

        return()=>{
            socket.off('user:joined',handleUserJoined)
            socket.off('incomming call',handleincommingCall)

        }
    },[socket,handleUserJoined,handleincommingCall])
    return(
        <div>
            <h1>Room Page</h1>
            <h4>{remoteSocketId ? 'Connected': 'No one in room'}</h4>
            {
                remoteSocketId && <button onClick={handleCallUser}>CALL</button>
            }
            <h1>My Stream</h1>
            {
                myStream && <ReactPlayer playing muted height="300px" width="750px" url = {myStream}/>
            }
        </div>
    )
}

export default Roompage