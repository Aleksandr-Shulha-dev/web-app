import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { SDKProvider, useSDK, useMainButton, useBackButton, useInitData, useLaunchParams } from '@tma.js/sdk-react';

function MainButtonTest() {
  const mainButton = useMainButton();
  const backButton = useBackButton();

  const [count, setCount] = useState(0);

  useEffect(() => {
    const onMainButtonClick = () => setCount((prevCount) => prevCount + 1);
    const onBackButtonClick = () => setCount((prevCount) => prevCount - 1);

    mainButton.enable().show();
    mainButton.on('click', onMainButtonClick);
    backButton.on('click', onBackButtonClick);

    return () => {
      mainButton.off('click', onMainButtonClick);
      mainButton.hide();
      backButton.off('click', onBackButtonClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mainButton.setText(`Count is ${count}`);
  }, [mainButton, count]);

  useEffect(() => {
    if (count === 0) {
      backButton.hide();
      return;
    }
    backButton.show();
  }, [backButton, count]);

  return null;
}

/**
 * Displays current application init data.
 */
function InitData() {
  const initData = useInitData();
  const launchParams = useLaunchParams();

  const initDataJson = useMemo(() => {
    if (!initData) {
      return 'Init data is empty.';
    }
    const { authDate, chat, hash, canSendAfter, queryId, receiver, user, startParam } = initData;

    return JSON.stringify({
      authDate,
      chat,
      hash,
      canSendAfter,
      queryId,
      receiver,
      user,
      startParam,
      launchParams,
    }, null, ' ');
  }, [initData, launchParams]);

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/checkInitData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        initData: launchParams.initDataRaw,
        detail: initData,
        launchParams,
      }),
    })
      .then((res) => res.json())
      .then((data) => console.log(data))
      .catch((e) => console.log(e));
  }, [launchParams, initData]);

  return (
    <pre>
      <code>
        {initDataJson}
      </code>
    </pre>
  );
}

/**
 * This component is the layer controlling the application display. It displays
 * application in case, the SDK is initialized, displays an error if something
 * went wrong, and a loader if the SDK is warming up.
 */
function DisplayGate({ children }: PropsWithChildren) {
  const { didInit, components, error } = useSDK();
  const errorMessage = useMemo<null | string>(() => {
    if (!error) {
      return null;
    }

    return error instanceof Error ? error.message : 'Unknown error';
  }, [error]);

  // There were no calls of SDK's init function. It means, we did not
  // even try to do it.
  if (!didInit) {
    return <div>SDK init function is not yet called.</div>;
  }

  // Error occurred during SDK init.
  if (error !== null) {
    return (
      <>
        <p>
          SDK was unable to initialize. Probably, current application is being used
          not in Telegram Web Apps environment.
        </p>
        <blockquote>
          <p>{errorMessage}</p>
        </blockquote>
      </>
    );
  }

  // If components is null, it means, SDK is not ready at the
  // moment and currently initializing. Usually, it takes like
  // several milliseconds or something like that, but we should
  // have this check.
  if (components === null) {
    return <div>Loading..</div>;
  }

  // Safely render application.
  return children;
}

/**
 * Root component of the whole project.
 */
export function Root() {
  return (
    <SDKProvider initOptions={{ debug: true, cssVars: true }}>
      <DisplayGate>
        <InitData />
        <MainButtonTest />
      </DisplayGate>
    </SDKProvider>
  );
}
