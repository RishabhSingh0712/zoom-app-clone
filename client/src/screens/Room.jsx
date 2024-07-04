import React, { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import ReactPlayer from "react-player"
import peer from "../service/peer";


const Roompage = ()=>{
    const socket = useSocket();
    const [remoteSocketId, setremoteSocketId] = useState(null)
    const [myStream,setmyStream]= useState(null)
    const [remotestream,setremotestream]= useState(null)

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
        setremoteSocketId(from);
        const stream = await navigator.mediaDevices.getUserMedia({audio:true,video:true});
        setmyStream(stream);
        console.log(`incomming call`,from,offer);
        const ans = await peer.getAnswer(offer)
        socket.emit("call:accepted", {to:from,ans})
    },[socket])

    const sendStream= useCallback(()=> {
        for (const track of myStream.getTracks()){
            peer.peer.addTrack(track,myStream);
        }
    },[myStream]);
    
    const handleCallAccepted = useCallback (({from,ans})=>{
        peer.setLocalDescription(ans)
        console.log('call Accepted');
        sendStream();
        
    },[sendStream]);

    const handleNegoNeeded = useCallback(async()=>{
        const offer = await peer.getOffer();
            socket.emit('peer:nego:needed',{offer,to:remoteSocketId});
        
    },[remoteSocketId,socket]);

    useEffect(()=>{
        peer.peer.addEventListener('negotiationneeded',handleNegoNeeded)
            return()=>{
                peer.peer.removeEventListener('negotiationneeded',handleNegoNeeded)
  
            }
    },[handleNegoNeeded])

    const handleNegoNeedIncoming= useCallback(async({from,offer})=>{
        const ans = await peer.getAnswer(offer);
        socket.emit("peer:nego:done",{to:from,ans})

    },[socket])

    const handleNegoNeedfinal = useCallback(async({ans})=>{
        await peer.setLocalDescription(ans) 
    },[])

    useEffect(()=>{
        peer.peer.addEventListener('track',async ev =>{
        const remotestream = ev.streams;
        setremotestream(remotestream[0]);

        })
    },[])

    useEffect(()=>{
        socket.on("user:joined",handleUserJoined)
        socket.on('incomming call',handleincommingCall)
        socket.on('call:accepted',handleCallAccepted)
        socket.on('peer:nego:needed',handleNegoNeedIncoming)
        socket.on('peer:nego:final',handleNegoNeedfinal)


        return()=>{
            socket.off('user:joined',handleUserJoined)
            socket.off('incomming call',handleincommingCall)
            socket.off('call:accepted',handleCallAccepted)
            socket.off('peer:nego:needed',handleNegoNeedIncoming)
            socket.off('peer:nego:final',handleNegoNeedfinal)

        }
    },[socket,handleUserJoined,handleincommingCall,handleCallAccepted,handleNegoNeedIncoming,handleNegoNeedfinal])
    
    return(
        <div>
            <h1>Room Page</h1>
            <h4>{remoteSocketId ? 'Connected': 'No one in room'}</h4>
            {myStream && <button onClick={sendStream}> Send Stream</button>}
            {
                remoteSocketId && <button onClick={handleCallUser}>CALL</button>
            }
            <h1>My Stream</h1>
            {
                myStream && <ReactPlayer playing muted height="300px" width="750px" url = {myStream}/>
            }
            <h1>Remote Stream</h1>
            {
                remotestream && <ReactPlayer playing muted height="300px" width="750px" url = {remotestream}/>
            }
        </div>
    )
}

export default Roompage