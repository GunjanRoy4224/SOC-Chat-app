import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useWebRTC(roomId, userId, onCallLog) {
  const [callState, setCallState] = useState('idle'); // idle, ringing, incoming, active
  const [remoteStream, setRemoteStream] = useState(null);
  
  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const channel = useRef(null);
  
  const callerId = useRef(null);
  const callStartTime = useRef(null);
  const finalStatus = useRef(null);

  useEffect(() => {
    if (!roomId) return;
    
    // Dedicated signaling channel for WebRTC
    const signaling = supabase.channel(`webrtc:${roomId}`);
    
    signaling
      .on('broadcast', { event: 'call_offer' }, ({ payload }) => {
        if (payload.senderId === userId) return;
        if (callState !== 'idle') return; // busy
        
        callerId.current = payload.senderId;
        setCallState('incoming');
        signaling.pendingOffer = payload.offer;
      })
      .on('broadcast', { event: 'call_answer' }, async ({ payload }) => {
        if (payload.senderId === userId) return;
        if (peerConnection.current && callState === 'ringing') {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
          setCallState('active');
          callStartTime.current = Date.now();
        }
      })
      .on('broadcast', { event: 'ice_candidate' }, async ({ payload }) => {
        if (payload.senderId === userId) return;
        if (peerConnection.current) {
          try {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch(e) { console.error("Error adding ice candidate", e); }
        }
      })
      .on('broadcast', { event: 'call_end' }, ({ payload }) => {
        if (payload.senderId === userId) return;
        
        let status = payload.status || 'ended';
        if (callState === 'ringing' && status === 'declined') status = 'declined';
        
        cleanupCall(status);
      });

    signaling.subscribe();
    channel.current = signaling;

    return () => {
      cleanupCall('ended');
      signaling.unsubscribe();
    };
  }, [roomId, userId, callState]);

  const initPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        channel.current?.send({
          type: 'broadcast',
          event: 'ice_candidate',
          payload: { senderId: userId, candidate: e.candidate }
        });
      }
    };

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
    };

    return pc;
  };

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.current = stream;
      
      const pc = initPeerConnection();
      peerConnection.current = pc;
      callerId.current = userId;
      
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      channel.current?.send({
        type: 'broadcast',
        event: 'call_offer',
        payload: { senderId: userId, offer }
      });
      
      setCallState('ringing');
    } catch(err) {
      console.error("Failed to start call", err);
      alert("Could not access microphone.");
    }
  };

  const acceptCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.current = stream;
      
      const pc = initPeerConnection();
      peerConnection.current = pc;
      
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      
      await pc.setRemoteDescription(new RTCSessionDescription(channel.current.pendingOffer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      channel.current?.send({
        type: 'broadcast',
        event: 'call_answer',
        payload: { senderId: userId, answer }
      });
      
      setCallState('active');
      callStartTime.current = Date.now();
    } catch(err) {
      console.error("Failed to accept call", err);
      cleanupCall('failed');
    }
  };

  const endCall = () => {
    if (callState === 'idle') return;
    
    let status = 'ended';
    if (callState === 'ringing') status = 'cancelled';
    if (callState === 'incoming') status = 'declined';

    channel.current?.send({
      type: 'broadcast',
      event: 'call_end',
      payload: { senderId: userId, status }
    });

    cleanupCall(status);
  };

  function cleanupCall(status = 'ended') {
    // Only the original caller creates the call log in the DB
    if (onCallLog && callerId.current === userId) {
      const duration = callStartTime.current ? Math.floor((Date.now() - callStartTime.current) / 1000) : 0;
      onCallLog({
        type: 'voice',
        callerId: callerId.current,
        startTime: callStartTime.current || Date.now(),
        endTime: Date.now(),
        duration,
        status: status
      });
    }

    if (localStream.current) {
      localStream.current.getTracks().forEach(t => t.stop());
      localStream.current = null;
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setCallState('idle');
    setRemoteStream(null);
    callStartTime.current = null;
    callerId.current = null;
  }

  return {
    callState,
    remoteStream,
    startCall,
    acceptCall,
    endCall
  };
}
