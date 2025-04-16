// SendMoneyScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TransactionsService } from '../services/transactionsService';
import { formatCurrency } from '../utils/formatCurrency';

export const SendMoneyScreen: React.FC = () => {
  const [receiverNickname, setReceiverNickname] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(true);
  
  const navigation = useNavigation();

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setLoadingBalance(true);
        const response = await TransactionsService.getBalance();
        setBalance(response.balance);
      } catch (error) {
        console.error('Error loading balance:', error);
        Alert.alert('Erro', 'Não foi possível carregar seu saldo');
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchBalance();
  }, []);

  const handleSendMoney = async () => {
    // Validação dos campos
    if (!receiverNickname.trim()) {
      Alert.alert('Erro', 'Por favor, informe o apelido do destinatário');
      return;
    }

    const amountValue = parseFloat(amount.replace(',', '.'));
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Erro', 'Por favor, informe um valor válido');
      return;
    }

    if (amountValue > balance) {
      Alert.alert('Saldo insuficiente', 'Você não tem saldo suficiente para realizar esta transferência');
      return;
    }

    try {
      setLoading(true);
      await TransactionsService.sendMoney(receiverNickname, amountValue, description);
      Alert.alert(
        'Sucesso', 
        'Transferência realizada com sucesso!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error sending money:', error);
      Alert.alert('Erro', 'Não foi possível realizar a transferência. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Formatar valor enquanto digita
  const handleAmountChange = (text: string) => {
    // Remove tudo que não for número ou vírgula
    const cleanedText = text.replace(/[^0-9,]/g, '');
    
    // Permite apenas uma vírgula
    const parts = cleanedText.split(',');
    if (parts.length > 2) {
      return;
    }
    
    setAmount(cleanedText);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container}>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Seu saldo disponível</Text>
          {loadingBalance ? (
            <ActivityIndicator size="small" color="#4a86e8" />
          ) : (
            <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
          )}
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Apelido do destinatário</Text>
          <TextInput
            style={styles.input}
            value={receiverNickname}
            onChangeText={setReceiverNickname}
            placeholder="Digite o apelido"
            autoCapitalize="none"
          />
          
          <Text style={styles.label}>Valor</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={handleAmountChange}
            placeholder="0,00"
            keyboardType="numeric"
          />
          
          <Text style={styles.label}>Descrição (opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Adicione uma descrição para a transferência"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendMoney}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Enviar dinheiro</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  balanceContainer: {
    backgroundColor: '#4a86e8',
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 5,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#555',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  button: {
    height: 50,
    backgroundColor: '#4a86e8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#a0bfea',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});