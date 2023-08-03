import React, { useEffect, useState } from 'react'
import styles from './Admin.module.scss'

import { clearAllBodyScrollLocks } from "body-scroll-lock";
import { Password } from './password/Password';
import { Table } from './table/Table';

export const Admin = () => {

    const [showAdmin, setShowAdmin] = useState(false);

    return (
        <main className={styles.main}>
            {showAdmin == false ?
                <Password setShowAdmin={setShowAdmin} />
                :
                <Table />
            }
        </main>
    )
}