import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, TextInput } from 'react-native';


export function JoinScreen({ navigation }) {

  const [sessionName, setSessionName] = useState('');
  const [token, setToken] = useState('');

  return (
    <View style={styles.container}>
      {/* session name */}
      <View style={styles.inputContainer}>
        <View style={styles.textWrapper}>
          <Text style={styles.text}>Session Name</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder={"Required"}
          value={sessionName}
          onChangeText={setSessionName}
          autoCapitalize="none"
        />
      </View>
      {/* token */}
      <View style={styles.inputContainer}>
        <View style={styles.textWrapper}>
          <Text style={styles.text}>Token</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder={"Required"}
          value={token}
          onChangeText={setToken}
        />
      </View>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('Call', {
            sessionName,
            token,
          })}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Start</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 50
  },
  inputContainer: {
    marginLeft: 10,
    paddingVertical: 5,
    alignItems: 'center',
    flexDirection: 'row',
    borderBottomColor: '#8b8b9b',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  textWrapper: {
    flex: 1,
  },
  text: {
    color: '#8b8b9b',
  },
  input: {
    flex: 2,
    height: 40,
  },
  button: {
    backgroundColor: '#0e71eb',
    alignItems: 'center',
    marginTop: 15,
    marginHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
  },
});
