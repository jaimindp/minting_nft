import styles from 'styles/Home.module.scss'
import { ThemeToggleButton, ThemeToggleList } from 'components/Theme'
import { useState, useEffect } from 'react'
import { useNetwork, useSwitchNetwork, useAccount, useBalance } from 'wagmi'
import ConnectWallet from 'components/Connect/ConnectWallet'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useConnectModal, useAccountModal, useChainModal } from '@rainbow-me/rainbowkit'
import { useSignMessage } from 'wagmi'
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env.local' });


export default function Home() {
  return (
    <div className={styles.container}>
      <Header />
      <Main />
      <Footer />
    </div>
  )
}

function Header() {
  return (
    <header className={styles.header}>
      <div>
        <ThemeToggleList />
      </div>
      <div className="flex items-center">
        <ThemeToggleButton /> header <ThemeToggleList />
      </div>

      <div className="flex items-center">
        <ThemeToggleButton />
        <ThemeToggleList />
      </div>
    </header>
  )
}

function Main() {
  const { address, isConnected, connector } = useAccount()
  const { chain, chains } = useNetwork()
  const { isLoading: isNetworkLoading, pendingChainId, switchNetwork } = useSwitchNetwork()
  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address: address,
  })
  // const {isBridgeLoading}
  const { openConnectModal } = useConnectModal()
  const { openAccountModal } = useAccountModal()
  const { openChainModal } = useChainModal()
  const [quote, setQuote] = useState(null)
  const [quoteCount, setQuoteCount] = useState(0)
  const socket_api = process.env.NEXT_PUBLIC_SOCKET_TEST_API

  // Trigger fetching quote when a certain condition is met, e.g., address changes
  useEffect(() => {
    if (address) {
      fetchBridgeSwapQuote();
    }
  }, []); // Dependency array

  async function fetchBridgeSwapQuote() {
        // Bridging Params fetched from users
        // const fromChainId = 137;
        // const toChainId = 56;
        // const fromAssetAddress = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
        // const toAssetAddress = "0x55d398326f99059fF775485246999027B3197955";
        // const amount = 100000000; // 100 USDC, USDC is 6 decimals
        // const userAddress = "0x89d9Dd2e85ecC305E276f51BB21fd4C708Be9487";
        // const uniqueRoutesPerBridge = true; // Returns the best route for a given DEX / bridge combination
        // const sort = "output"; // "output" | "gas" | "time"
        // const singleTxOnly = true;
      //   const quote = await getQuote(fromChainId,
      //     fromAssetAddress, toChainId,
      //     toAssetAddress, amount,
      //     userAddress, uniqueRoutesPerBridge, sort, singleTxOnly
      // );
  
      // // Choosing first route from the returned route results 
      // const route = quote.result.routes[0];

    // Makes a GET request to Socket APIs for quote
async function getQuote(fromChainId, fromTokenAddress, toChainId, toTokenAddress, fromAmount, userAddress, uniqueRoutesPerBridge, sort, singleTxOnly) {
  const response = await fetch(`https://api.socket.tech/v2/quote?fromChainId=${fromChainId}&fromTokenAddress=${fromTokenAddress}&toChainId=${toChainId}&toTokenAddress=${toTokenAddress}&fromAmount=${fromAmount}&userAddress=${userAddress}&uniqueRoutesPerBridge=${uniqueRoutesPerBridge}&sort=${sort}&singleTxOnly=${singleTxOnly}`, {
      method: 'GET',
      headers: {
          'API-KEY': socket_api,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
      }
  });

  const json = await response.json();
  return json;
}

  // Makes a POST request to Socket APIs for swap/bridge transaction data
async function getRouteTransactionData(route) {
  const response = await fetch('https://api.socket.tech/v2/build-tx', {
      method: 'POST',
      headers: {
          'API-KEY': socket_api,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ "route": route })
  });

  const json = await response.json();
  return json;
}

// GET request to check token allowance given to allowanceTarget by owner
async function checkAllowance(chainId, owner, allowanceTarget, tokenAddress) {
  const response = await fetch(`https://api.socket.tech/v2/approval/check-allowance?chainID=${chainId}&owner=${owner}&allowanceTarget=${allowanceTarget}&tokenAddress=${tokenAddress}`, {
      method: 'GET',
      headers: {
          'API-KEY': socket_api,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
      }
  });

  const json = await response.json();
  return json;
}

// Fetches transaction data for token approval 
async function getApprovalTransactionData(chainId, owner, allowanceTarget, tokenAddress, amount) {
  const response = await fetch(`https://api.socket.tech/v2/approval/build-tx?chainID=${chainId}&owner=${owner}&allowanceTarget=${allowanceTarget}&tokenAddress=${tokenAddress}&amount=${amount}`, {
      method: 'GET',
      headers: {
          'API-KEY': socket_api,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
      }
  });

  const json = await response.json();
  return json;
}
  
// Fetches status of the bridging transaction
async function getBridgeStatus(transactionHash, fromChainId, toChainId) {
  const response = await fetch(`https://api.socket.tech/v2/bridge-status?transactionHash=${transactionHash}&fromChainId=${fromChainId}&toChainId=${toChainId}`, {
      method: 'GET',
      headers: {
          'API-KEY': socket_api,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
      }
  });

  const json = await response.json();
  return json;
}

// Choosing first route from the returned route results 
const route = quote.result.routes[0];

// Fetching transaction data for swap/bridge tx
const apiReturnData = await getRouteTransactionData(route);

// Used to check for ERC-20 approvals
const approvalData = apiReturnData.result.approvalData;
const { allowanceTarget, minimumApprovalAmount } =approvalData;

// approvalData from apiReturnData is null for native tokens 
// Values are returned for ERC20 tokens but token allowance needs to be checked
if (approvalData !== null) {
    // Fetches token allowance given to Socket contracts
    const allowanceCheckStatus = await checkAllowance(fromChainId, userAddress, allowanceTarget, fromAssetAddress)
    const allowanceValue = allowanceCheckStatus.result?.value;

    // If Socket contracts don't have sufficient allowance
    if (minimumApprovalAmount > allowanceValue) {
        // Approval tx data fetched
        const approvalTransactionData = await getApprovalTransactionData(fromChainId, userAddress, allowanceTarget, fromAssetAddress, amount);

        const gasPrice = await signer.getGasPrice();

        const gasEstimate = await provider.estimateGas({
            from: signer.address,
            to: approvalTransactionData.result?.to,
            value: '0x00',
            data: approvalTransactionData.result?.data,
            gasPrice: gasPrice
        });

        const tx = await signer.sendTransaction({
            from: approvalTransactionData.result?.from,
            to: approvalTransactionData.result?.to,
            value: '0x00',
            data: approvalTransactionData.result?.data,
            gasPrice: gasPrice,
            gasLimit: gasEstimate
        });

        // Initiates approval transaction on user's frontend which user has to sign
        const receipt = await tx.wait();

        console.log('Approval Transaction Hash :', receipt.transactionHash);
    }
}

const gasPrice = await signer.getGasPrice();

const gasEstimate = await provider.estimateGas({
    from: signer.address,
    to: apiReturnData.result.txTarget,
    value: apiReturnData.result.value,
    data: apiReturnData.result.txData,
    gasPrice: gasPrice
});

const tx = await signer.sendTransaction({
    from: signer.address,
    to: apiReturnData.result.txTarget,
    data: apiReturnData.result.txData,
    value: apiReturnData.result.value,
    gasPrice: gasPrice,
    gasLimit: gasEstimate
});

// Initiates swap/bridge transaction on user's frontend which user has to sign
const receipt = await tx.wait();

const txHash = receipt.transactionHash;

console.log('Bridging Transaction : ', receipt.transactionHash);

// Checks status of transaction every 20 secs
const txStatus = setInterval(async () => {
    const status = await getBridgeStatus(txHash, fromChainId, toChainId);

    console.log(`SOURCE TX : ${status.result.sourceTxStatus}\nDEST TX : ${status.result.destinationTxStatus}`)

    if (status.result.destinationTxStatus == "COMPLETED") {
        console.log('DEST TX HASH :', status.result.destinationTransactionHash);
        clearInterval(txStatus);
    }
}, 20000);


    // Move the asynchronous logic here
    // Use setQuote to update the quote state
  }

  return (
    <main className={styles.main + ' space-y-6'}>
      <div className="text-center">
        <p className="font-medium">Jaimin&apos;s everything testing dApp</p>
        <p>
          <a
            href="https://github.com/arisac/dapp-starter"
            target="_blank"
            className="text-sm underline"
            rel="noreferrer"
          >
            Socket API = &nbsp; 
            {process.env.NEXT_PUBLIC_SOCKET_TEST_API}
          </a>
        </p>
      </div>

      <div>
        <div className="flex w-full flex-col items-center">
          <ConnectWallet />
        </div>
      </div>

      <div>
        <div className="flex w-full flex-col items-center">
          {openConnectModal && (
            <button
              onClick={openConnectModal}
              type="button"
              className="m-1 rounded-lg bg-orange-500 py-1 px-3 text-white transition-all duration-150 hover:scale-105"
            >
              useConnectModal
            </button>
          )}

          {openAccountModal && (
            <button
              onClick={openAccountModal}
              type="button"
              className="m-1 rounded-lg bg-orange-500 py-1 px-3 text-white transition-all duration-150 hover:scale-105"
            >
              useAccountModal
            </button>
          )}

          {openChainModal && (
            <button
              onClick={openChainModal}
              type="button"
              className="m-1 rounded-lg bg-orange-500 py-1 px-3 text-white transition-all duration-150 hover:scale-105"
            >
              useChainModal
            </button>
          )}
        </div>
      </div>

      <div className="w-full max-w-xl rounded-xl bg-sky-500/10 p-6 text-center">
        <dl className={styles.dl}>
          <dt>Connector</dt>
          <dd>
            {connector?.name}
            {!address && (
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <span onClick={openConnectModal} className="cursor-pointer hover:underline">
                    Not connected, connect wallet
                  </span>
                )}
              </ConnectButton.Custom>
            )}
          </dd>
          <dt>Connected Network</dt>
          <dd>{chain ? `${chain?.id}: ${chain?.name}` : 'n/a'}</dd>
          <dt>Switch Network</dt>
          <dd className="flex flex-wrap justify-center">
            {isConnected &&
              chains.map(x => (
                <button
                  disabled={!switchNetwork || x.id === chain?.id}
                  key={x.id}
                  onClick={() => switchNetwork?.(x.id)}
                  className={
                    (x.id === chain?.id ? 'bg-green-500' : 'bg-blue-500 hover:scale-105') +
                    ' m-1 rounded-lg py-1 px-3 text-white transition-all duration-150'
                  }
                >
                  {x.name}
                  {isNetworkLoading && pendingChainId === x.id && ' (switching)'}
                </button>
              ))}
            <ConnectWallet show="disconnected" />
          </dd>
          <dt>Account</dt>
          <dd className="break-all">{address ? `${address}` : 'n/a'}</dd>
          <dt>Balance</dt>
          <dd className="break-all">
            {isBalanceLoading ? 'loading' : balance ? `${balance?.formatted} ${balance?.symbol}` : 'n/a'}
          </dd>
          <dt>Sign Message</dt>
          <dd className="break-all">{address ? <SignMsg /> : 'n/a'} </dd>
          <dt>Bridge</dt>
          <dd className="break-all">{address ? BridgeSwap(quote, setQuote, quoteCount, setQuoteCount)  : 'n/a'}
          {/* <dd className="break-all">{address ? <BridgeSwap(quote, setQuote) /> : 'n/a'} */}
            {'i '+quote}
          </dd>
        </dl>
      </div>
    </main>
  )
}

function BridgeSwap(quote, setQuote, quoteCount, setQuoteCount) {
  const socket_api = process.env.NEXT_PUBLIC_SOCKET_TEST_API 
  async function getQuote(){

    const bridges= 'https://api.socket.tech/v2/supported/bridges'

    // Swapping tether on ETH to MATIC on polygon
    // const fromTokenAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
    // const toTokenAddress = '0x0000000000000000000000000000000000001010'
    // const fromChainId = '1'
    // const toChainId = '137'
    // const fromAmount = '10'

    const fromChainId = '137';
    const toChainId = '56';
    const fromTokenAddress = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
    const toTokenAddress = "0x55d398326f99059fF775485246999027B3197955";
    const fromAmount = "1267160"
    const userAddress = '0x89d9Dd2e85ecC305E276f51BB21fd4C708Be9487'
    const recipient = '0x89d9Dd2e85ecC305E276f51BB21fd4C708Be9487'
    const quote = 'https://api.socket.tech/v2/quote?fromChainId=1&fromTokenAddress=0x2791bca1f2de4661ed88a30c99a7a9449aa84174&toChainId=56&toTokenAddress=0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3&fromAmount=100000000&userAddress=0x3e8cB4bd04d81498aB4b94a392c334F5328b237b&recipient=0x3e8cB4bd04d81498aB4b94a392c334F5328b237b&uniqueRoutesPerBridge=true&sort=output'

    const quote_string = `https://api.socket.tech/v2/quote?fromChainId=${fromChainId}&fromTokenAddress=${fromTokenAddress}&toChainId=${toChainId}&toTokenAddress=${toTokenAddress}&fromAmount=${fromAmount}&userAddress=${userAddress}&recipient=${recipient}&uniqueRoutesPerBridge=true&sort=output`
    const endpoint = quote_string
    console.log('socket api being hit')

    const headers = {
      'API-KEY': socket_api,
    };
    // Now, you can use axios to make HTTP requests to the endpoint
    axios.get(endpoint, {headers})
      .then((response) => {
        console.log('Response:', response.data);
        const route = response.data.result.routes[0]
        console.log('Route:', route);
        setQuote(route)
        // getRouteTransactionData(route)
        // quote = response.data
      })
      .catch((error) => {
        console.error('Error:', error);
      });
    setQuoteCount(quoteCount+1)
  }

  return (
    <>
    <p>
      <button
        onClick={() => getQuote()}
        className="ml-1 rounded-lg bg-blue-500 py-1 px-2 text-white transition-all duration-150 hover:scale-105"
        >
          Get Quote
        </button>
        quote: {quote}
    </p>
    </>
  )
}

function SignMsg() {
  const [msg, setMsg] = useState('Dapp Starter')
  const { data, isError, isLoading, isSuccess, signMessage } = useSignMessage({
    message: msg,
  })
  const signMsg = () => {
    if (msg) {
      signMessage()
    }
  }

  return (
    <>
      <p>
        <input value={msg} onChange={e => setMsg(e.target.value)} className="rounded-lg p-1" />
        <button
          disabled={isLoading}
          onClick={() => signMsg()}
          className="ml-1 rounded-lg bg-blue-500 py-1 px-2 text-white transition-all duration-150 hover:scale-105"
        >
          Sign
        </button>
      </p>
      <p>
        {isSuccess && <span>Signature: {data}</span>}
        {isError && <span>Error signing message</span>}
      </p>
    </>
  )
}

function Footer() {
  return (
    <footer className={styles.footer}>
      <div>
        <ThemeToggleList />
      </div>
      <div className="flex items-center">
        <ThemeToggleButton /> footer <ThemeToggleList />
      </div>

      <div className="flex items-center">
        <ThemeToggleButton />
        <ThemeToggleList />
      </div>
    </footer>
  )
}
