function HistoryList({ tabs, onViewTab }) {
    try {
        const [searchTerm, setSearchTerm] = React.useState('');
        const [startDate, setStartDate] = React.useState('');
        const [endDate, setEndDate] = React.useState('');
        const [filteredTabs, setFilteredTabs] = React.useState(tabs);
        
        // Apply filters
        React.useEffect(() => {
            let filtered = tabs;
            
            // Filter by search term
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                filtered = filtered.filter(tab => 
                    tab.customerName.toLowerCase().includes(search) || 
                    tab.number.toString().includes(search)
                );
            }
            
            // Filter by date range
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                filtered = filtered.filter(tab => new Date(tab.closedAt) >= start);
            }
            
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filtered = filtered.filter(tab => new Date(tab.closedAt) <= end);
            }
            
            setFilteredTabs(filtered);
        }, [tabs, searchTerm, startDate, endDate]);
        
        const handleViewTab = (tab) => {
            if (onViewTab) {
                onViewTab(tab);
            }
        };
        
        const getPaymentMethodLabel = (method) => {
            const methods = {
                'cash': 'Dinheiro',
                'credit': 'Crédito',
                'debit': 'Débito',
                'pix': 'Pix',
                'transfer': 'Transferência'
            };
            
            return methods[method] || method;
        };
        
        const getPaymentMethodIcon = (method) => {
            const icons = {
                'cash': 'fas fa-money-bill-wave',
                'credit': 'fas fa-credit-card',
                'debit': 'fas fa-credit-card',
                'pix': 'fas fa-qrcode',
                'transfer': 'fas fa-university'
            };
            
            return icons[method] || 'fas fa-money-bill-wave';
        };
        
        return (
            <div data-name="history-list" className="card">
                <div data-name="history-header" className="card-header">
                    <h3 className="card-title">Histórico de Comandas</h3>
                </div>
                
                <div data-name="history-filters" className="mb-4">
                    <SearchBar
                        placeholder="Buscar por cliente ou número..."
                        value={searchTerm}
                        onChange={setSearchTerm}
                    />
                    
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                            <label className="form-label text-sm">Data Inicial</label>
                            <input
                                data-name="start-date"
                                type="date"
                                className="form-control"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="form-label text-sm">Data Final</label>
                            <input
                                data-name="end-date"
                                type="date"
                                className="form-control"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                
                {filteredTabs.length === 0 ? (
                    <div data-name="empty-history" className="empty-state">
                        <div className="empty-state-icon">
                            <i className="fas fa-history"></i>
                        </div>
                        <div className="empty-state-text">Nenhuma comanda fechada encontrada</div>
                    </div>
                ) : (
                    <div data-name="history-table" className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Comanda</th>
                                    <th>Cliente</th>
                                    <th>Data</th>
                                    <th>Pagamento</th>
                                    <th>Total</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTabs.map(tab => (
                                    <tr data-name={`history-row-${tab.id}`} key={tab.id}>
                                        <td>#{tab.number}</td>
                                        <td>{tab.customerName}</td>
                                        <td>{formatDateTime(tab.closedAt)}</td>
                                        <td>
                                            <div className="flex items-center">
                                                <i className={`${getPaymentMethodIcon(tab.paymentMethod)} mr-2`}></i>
                                                {getPaymentMethodLabel(tab.paymentMethod)}
                                            </div>
                                        </td>
                                        <td>{formatCurrency(tab.total)}</td>
                                        <td>
                                            <button
                                                data-name={`view-tab-${tab.id}`}
                                                className="btn btn-icon btn-sm btn-secondary"
                                                onClick={() => handleViewTab(tab)}
                                            >
                                                <i className="fas fa-eye"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    } catch (error) {
        console.error('HistoryList component error:', error);
        reportError(error);
        return null;
    }
}
