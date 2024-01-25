import './App.css';
import { Box ,Container, VStack, Button, HStack, Input } from '@chakra-ui/react';
import Message from './Components/Message';
import {signOut ,onAuthStateChanged ,getAuth, GoogleAuthProvider, signInWithPopup} from "firebase/auth";
import { app } from './firebase';
import { useEffect, useState } from 'react';
import { useRef } from 'react';
import { getFirestore, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy} from "firebase/firestore"

const auth = getAuth(app);
const db = getFirestore(app);

const loginHandler = () => {
  const provider = new GoogleAuthProvider();

  signInWithPopup(auth, provider)
}

const logoutHandler = () => signOut(auth)

function App() {

  const [user, setUser] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const divForScroll = useRef(null);
  const submitHandler = async(e)=>{
    e.preventDefault();
    try {
  
      await addDoc(collection(db, "Messages"),{
        text: message,
        uid: user.uid,
        uri: user.photoURL,
        createdAt: serverTimestamp()
      })
      setMessage("");
      divForScroll.current.scrollIntoView({behavior: "smooth"})
    } catch (error) {
      alert(error);
    }
  }
  useEffect(()=>{  
    const q = query(collection(db, "Messages"),orderBy("createdAt", "asc"))
    const unsubscribe = onAuthStateChanged(auth, (data)=>{
    setUser(data);
    });

    const unSubscribeForMessage = onSnapshot(q, collection(db, "Messages"), (snap)=>{
    setMessages(snap.docs.map((item) => {
        const id = item.id;
        return {id, ...item.data()};
      }))
    });
    return () => {
      unsubscribe();
      unSubscribeForMessage();
    }
  },[])

  return <Box bg={"red.50"}>
    {
      user?(
        <Container h={"100vh"} bg={"white"}>
      <VStack h="full" paddingY={"4"}>
        <Button onClick={logoutHandler} colorScheme='red' w={"full"}>
          Logout
        </Button>
        <VStack h="full" w={"full"} overflowY={"auto"} css={{"&::-webkit-scrollbar": {
          display: "none"
        }}}>
          {
            messages.map(item=>(
              <Message key={item.id} user={item.uid===user.uid?"me":"other"} text={item.text} uri = {item.uri} />
            ))
          }

<div ref={divForScroll}></div>
        </VStack>

        <form value={message} onChange={(e)=>{
          setMessage(e.target.value)
        }} onSubmit={submitHandler} style={{width: "100%"}}>
          <HStack>
            <Input value={message} onChange={(e)=>{
          setMessage(e.target.value)
        }} placeholder='Enter a Message...' />
              <Button colorScheme='purple' type='submit'>Send</Button>
          </HStack>
        </form>
      </VStack>
    </Container>
      ): <VStack bg="white" alignItems={"center"} h="100vh" justifyContent={"center"}>
        <Button onClick={loginHandler} colorScheme='purple'>Sign In with google</Button>
      </VStack>
    }
  </Box>
}

export default App;
