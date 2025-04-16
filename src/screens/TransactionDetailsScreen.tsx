// TransactionDetailsScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { TransactionsService, Transaction } from '../services/transactionsService';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDateTime } from '../utils/formatDate';

type RouteParams = {
  TransactionDetails: {
    transactionId: string;
  };
};

export const TransactionDetailsScreen: React.FC = () => {
  const route = useRoute<RouteProp<RouteParams, 'TransactionDetails'>>();
  const { transactionId } = route.params;
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      try {
        setLoading(true);
        const data = await TransactionsService.getTransactionById(transactionId);
        setTransaction(data);
        setError(null);
      } catch (err) {
        console.error('Error loading transaction details:', err);
        setError('Não foi possível carregar os detalhes da transação');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionDetails();
  }, [transactionId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a86e8" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Transação não encontrada</Text>
      </View>
    );
  }

  const isIncome = transaction.type === 'INCOME';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Detalhes da Transação</Text>
          <Text style={[
            styles.value,
            { color: isIncome ? '#2ecc71' : '#e74c3c' }
          ]}>
            {isIncome ? '+' : '-'} {formatCurrency(transaction.value)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Tipo</Text>
            <Text style={styles.text}>
              {isIncome ? 'Recebimento' : 'Envio'}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Data</Text>
            <Text style={styles.text}>{formatDateTime(transaction.createdAt)}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>ID</Text>
            <Text style={styles.text}>{transaction.id}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descrição</Text>
          <Text style={styles.description}>
            {transaction.description || 'Sem descrição'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participantes</Text>
          
          {isIncome && transaction.fromUser && (
            <View style={styles.row}>
              <Text style={styles.label}>Remetente</Text>
              <Text style={styles.text}>{transaction.fromUser.nickname}</Text>
            </View>
          )}
          
          {!isIncome && transaction.toUser && (
            <View style={styles.row}>
              <Text style={styles.label}>Destinatário</Text>
              <Text style={styles.text}>{transaction.toUser.nickname}</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 15,
    color: '#666',
  },
  text: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  description: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
});