import React from 'react';

import {Button, StyleSheet} from 'react-native';

import {useCameraDevices} from 'react-native-vision-camera';
import {Camera} from 'react-native-vision-camera';
import {useScanBarcodes, BarcodeFormat} from 'vision-camera-code-scanner';
import {getQueryParam} from '../lib/utils';

export default function ScanScreen({route, navigation}) {
  const [hasPermission, setHasPermission] = React.useState(false);
  const devices = useCameraDevices();
  const device = devices.back;

  const {backScreen} = route.params;

  // console.log('Scan Screen backScreen, backRoot', backScreen, backRoot);
  const [frameProcessor, barcodes] = useScanBarcodes([BarcodeFormat.QR_CODE], {
    checkInverted: true,
  });

  React.useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized');
    })();
  }, []);

  const onSuccess = data => {
    console.log('scan success');
    console.dir(data);
    const cardNonce = getQueryParam(data, 'c');
    navigation.navigate(backScreen, {data: cardNonce, timestamp: Date.now()});
  };

  const goBack = e => {
    navigation.navigate(backScreen);
  };

  if (barcodes.length > 0) {
    onSuccess(barcodes[0].displayValue);
  }

  return (
    device != null &&
    hasPermission && (
      <>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          frameProcessor={frameProcessor}
          frameProcessorFps={5}
        />
        <Button
          onPress={() =>
            onSuccess('https://app.lawallet.ar/start?i=987654321&c=12345678')
          }
          title="Test"
        />
        <Button onPress={goBack} title="Close" />
      </>
    )
  );
}

const styles = StyleSheet.create({
  barcodeTextURL: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  centerText: {
    flex: 1,
    fontSize: 18,
    padding: 32,
    color: '#777',
  },
  textBold: {
    fontWeight: '500',
    color: '#000',
  },
  buttonText: {
    fontSize: 21,
    color: 'rgb(0,122,255)',
  },
  buttonTouchable: {
    padding: 16,
  },
});
