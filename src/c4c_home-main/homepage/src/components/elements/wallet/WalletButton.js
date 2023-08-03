import React from 'react'

import { useMetamask } from '../../../hooks/useMetamask'
import styles from './WalletButton.module.scss'

function getShortAddress(addr) {
    return addr.substring(0, 8) + '...' + addr.substring(addr.length - 6);
}

export const WalletButton = () => {
    const [
        connectWallet,
        disconnectWallet,
        selectedAccount,
        accountBalance,
        error,
        loading
    ] = useMetamask()

    /*
    if (loading) {
        return (
            <div className={styles.connect_btn}>
                Loading...
            </div>
        )
    }

    if (error) {
        return (
            <div className={styles.connect_btn}>
                {error}
            </div>
        )
    }
    */

    return (
        <div className={styles.wallet_button}
            onClick={selectedAccount ? null : connectWallet}>
            {selectedAccount ? getShortAddress(selectedAccount) : 'Connect Wallet'}
        </div>
    )
}