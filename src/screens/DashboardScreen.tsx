// DashboardScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator 
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { TransactionsService, Transaction } from '../services/transactionsService';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

// Define o tipo para as rotas da navegação
type RootStackParamList = {
  Dashboard: undefined;
  SendMoney: undefined;
  TransactionDetails: { transactionId: string };
  // Adicione outras rotas conforme necessário
};

export const DashboardScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // Agora tipando corretamente o hook de navegação
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const loadTransactions = useCallback(async (pageNumber = 1, shouldRefresh = false) => {
    if (loading || (!hasMore && !shouldRefresh)) return;
    
    try {
      setLoading(true);
      console.log('🔄 Carregando transações página:', pageNumber);
      const response = await TransactionsService.getTransactions(pageNumber);
      console.log('📊 Resposta de transações:', response);
      
      // Verificar se a resposta existe e tem o formato esperado
      if (response && response.transactions) {
        if (shouldRefresh) {
          setTransactions(response.transactions);
        } else {
          setTransactions(prev => [...prev, ...(response.transactions || [])]);
        }
        
        setHasMore(response.hasMore || false);
        setPage(pageNumber);
      } else {
        console.warn('Resposta da API inválida ou vazia:', response);
        if (shouldRefresh) {
          setTransactions([]);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar transações:', error);
      if (shouldRefresh) {
        setTransactions([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading, hasMore]);

  const loadBalance = useCallback(async () => {
    try {
      console.log('🔄 Carregando saldo');
      const response = await TransactionsService.getBalance();
      console.log('💰 Resposta de saldo:', response);
      
      if (response && typeof response.balance === 'number') {
        setBalance(response.balance);
      } else {
        console.warn('Resposta de saldo inválida:', response);
        // Manter o saldo atual em caso de erro
      }
    } catch (error) {
      console.error('❌ Erro ao carregar saldo:', error);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadBalance();
    loadTransactions(1, true);
  }, [loadTransactions, loadBalance]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadTransactions(page + 1);
    }
  }, [loading, hasMore, page, loadTransactions]);

  useEffect(() => {
    loadBalance();
    loadTransactions(1, true);
  }, [loadBalance, loadTransactions]);

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    if (!item) return null;
    
    const isIncome = item.type === 'INCOME';
    const fromUserNickname = item.fromUser?.nickname || 'desconhecido';
    const toUserNickname = item.toUser?.nickname || 'desconhecido';
    
    return (
      <TouchableOpacity 
        style={styles.transactionItem}
        onPress={() => {
          if (item.id) {
            navigation.navigate('TransactionDetails', { transactionId: item.id });
          }
        }}
      >
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDate}>
            {item.createdAt ? formatDate(item.createdAt) : 'Data desconhecida'}
          </Text>
          <Text style={styles.transactionDescription} numberOfLines={1}>
            {item.description || (isIncome 
              ? `Recebido de ${fromUserNickname}`
              : `Enviado para ${toUserNickname}`
            )}
          </Text>
        </View>
        <Text style={[
          styles.transactionValue,
          { color: isIncome ? '#2ecc71' : '#e74c3c' }
        ]}>
          {isIncome ? '+' : '-'} {formatCurrency(item.value || 0)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loading) return null;
    
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color="#4a86e8" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Seu saldo</Text>
          <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.newTransactionButton}
          onPress={() => navigation.navigate('SendMoney')}
        >
          <Text style={styles.newTransactionButtonText}>Nova Transferência</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.transactionsContainer}>
        <Text style={styles.transactionsTitle}>Extrato</Text>
        
        <FlatList
          data={transactions || []}
          keyExtractor={item => item.id || Math.random().toString()}
          renderItem={renderTransactionItem}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#4a86e8']}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            loading ? null : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nenhuma transação encontrada</Text>
              </View>
            )
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4a86e8',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  balanceContainer: {
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 5,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  newTransactionButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  newTransactionButtonText: {
    color: '#4a86e8',
    fontWeight: 'bold',
    fontSize: 16,
  },
  transactionsContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDate: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  transactionValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loaderContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});