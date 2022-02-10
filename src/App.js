import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import { useEffect, useState } from 'react';
import {Program, Provider, web3 } from '@project-serum/anchor';
import idl from './idl.json'
import { Connection, PublicKey, clusterApiUrl, SystemProgram} from '@solana/web3.js';
import kp from './keypair.json'

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
// const TEST_GIFS = [
//   'https://giphy.com//static/img/zoomies-small.gif',
//   'https://giphy.com//static/img/zoomies-small.gif',
//   'https://giphy.com//static/img/zoomies-small.gif',
//   'https://giphy.com//static/img/zoomies-small.gif',
//   'https://media0.giphy.com/media/d8n2mLJsJIyV6Z1jXv/giphy.gif'
// ]

const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret);

const programID = new PublicKey("Ez2j2EGUdws598Swm2Nw6aQdywp7ebBmap57wdkkYVMF");
const network = clusterApiUrl('devnet');
const opts = {
  preflightCommitment: "processed"
}
const getProvider = () => {
  const connection = new Connection(network, opts.preflightCommitment);
  const provider = new Provider(connection, window.solana, opts.preflightCommitment);
  return provider;
}

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);
  
  const checkIfWalletIsConnected = async () => {
    try {
      const {solana} = window;
      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!');
          const response = await solana.connect({ onlyIfTrusted: true});
          console.log('Connected with public key:', response.publicKey.toString());
          setWalletAddress(response.publicKey);
        }
      } else {
        alert('Solana object not found! Get a Phantom wallet');
      }
    } catch (error) {
      console.error(error);
    }
  }
  
  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad)
  }, [])
  
  const getGifList = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      
      console.log("Got the account", account)
      setGifList(account.gifList)
    } catch (error) {
      console.error(error);
      setGifList(null)
    }
  }
  
  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      })
      await getGifList();
    } catch (error) {
      console.log("error  creating base account: ", error)
    }
  }
  useEffect(() => {
    if (walletAddress) {
      getGifList();
    }
  }, [walletAddress])
  
  const connectWallet = async () => {
    const {solana} = window;
    if (solana) {
      const response = await solana.connect();
      console.log('Connected with public key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };
  const onInputChange = (event) => {
    const {value} = event.target;
    setInputValue(value);
  }
  const sendGif = async () => {
    if (inputValue.length > 0) {
      console.log('Gif link:', inputValue);
      setInputValue('');
      
      try {
        const provider = getProvider();
        const program = new Program(idl, programID, provider);
        
        await program.rpc.addGif(inputValue, {
          accounts: {
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey
          }
        })
        await getGifList();
      } catch (error) {
        console.log("Error sending GIF:", error);
      }
    } else {
      console.log('Empty input. Try again');
    }
  }
  const renderConnectedContainer = () => {
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      )
    }
    return (
      <div className="connected-container">
        <form
          onSubmit={event => {
            event.preventDefault();
            sendGif();
          }}
        >
          <input type="text" placeholder="Enter gif link!" value={inputValue} onChange={onInputChange}/>
          <button type="submit" className="cta-button submit-gif-butto">Submit</button>
        </form>
        <div className="gif-grid">
          {gifList.map((gif) => (
            <div className="gif-item" key="gif">
              <img src={gif.gifLink} alt={gif.gifLink} />
            </div>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header">🖼 GIF Portal</p>
          <p className="sub-text">
            View your GIF collection in the metaverse ✨
          </p>
          {!walletAddress && 
            <button 
              className="cta-button connect-wallet-button"
              onClick={connectWallet}
            >
            Connect to Wallet
          </button>
          }
          {walletAddress && 
            renderConnectedContainer()
          }
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
