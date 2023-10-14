import {useNavigation} from '@react-navigation/core';
import React, {useEffect} from 'react';
import {Button, ScrollView, StyleSheet, Text} from 'react-native';
import Dialog from 'react-native-dialog';
import {Card, Title} from 'react-native-paper';
export default function LinkCardQRScreen({route}) {
  // get data from QR
  const {data} = route.params || {};

  // use navigation
  const navigation = useNavigation();

  useEffect(() => {
    if (!data) {
      return;
    }
    alert(`HAY DATA: ${data}`);
  }, [data]);

  const startScan = () => {
    navigation.navigate('ScanScreen', {backScreen: 'Link QR'});
  };
  return (
    <ScrollView>
      <>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Scan QR Code</Title>
            <Text>First scan QR Code</Text>
          </Card.Content>
          <Card.Actions style={styles.spaceAround}>
            <Button onPress={startScan} title="Scan QR Code" />
          </Card.Actions>
        </Card>
        <Dialog.Container visible={false}>
          <Dialog.Title style={styles.textBlack}>Tap card baby</Dialog.Title>
          <Dialog.Description>Tap card</Dialog.Description>
          <Dialog.Button label="Cancel" onPress={() => {}} />
          <Dialog.Button label="Continue" onPress={() => {}} />
        </Dialog.Container>
      </>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  card: {
    margin: 20,
  },
  textBlack: {
    color: '#000',
  },

  spaceAround: {
    justifyContent: 'space-around',
  },
});
