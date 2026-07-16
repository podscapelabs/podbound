"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { signOut } from "@/app/account/actions";
import { acceptPlaytestAgreement, leaveEvent } from "@/app/arena/actions";
import styles from "@/app/arena/page.module.css";

type AgreementCopy = {
  title: string;
  version: string;
  introduction: string;
  terms: readonly string[];
};

export function PlaytestAgreementGate({ agreement, notice, signedIn }: { agreement: AgreementCopy; notice: string; signedIn: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (dialog.open) dialog.close();
    dialog.showModal();
    return () => { if (dialog.open) dialog.close(); };
  }, []);

  return <dialog
    ref={dialogRef}
    open
    className={styles.agreementGate}
    aria-labelledby="agreement-title"
    aria-describedby="agreement-introduction"
    onCancel={(event) => event.preventDefault()}
  >
    <section className={styles.agreementDialog}>
      <header><div><p className="eyebrow">Required before entry</p><h1 id="agreement-title">{agreement.title}</h1></div><span>Version {agreement.version}</span></header>
      <div className={styles.agreementNotice}><strong>Temporary public simulator test</strong><p>{notice}</p></div>
      <p className={styles.agreementIntro} id="agreement-introduction">{agreement.introduction}</p>
      <ol className={styles.agreementTerms}>{agreement.terms.map((term) => <li key={term}>{term}</li>)}</ol>
      <nav className={styles.agreementLinks} aria-label="Agreement documents"><Link href="/testing-disclaimer">Testing Disclaimer</Link><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Use</Link></nav>
      <div className={styles.agreementActions}>
        <form action={acceptPlaytestAgreement}><label className={styles.agreementCheck}><input autoFocus type="checkbox" name="agreementAccepted" value="yes" required /><span>I have read and agree to these playtest conditions.</span></label><button className="button primary">Agree and enter the Arena</button></form>
        {signedIn ? <form action={signOut}><button className="button secondary">Decline and sign out</button></form> : <form action={leaveEvent}><button className="button secondary">Decline and leave event</button></form>}
      </div>
    </section>
  </dialog>;
}
