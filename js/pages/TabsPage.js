function TabsPage() {
    try {
        const [tabs, setTabs] = React.useState([]);
        const [selectedTabId, setSelectedTabId] = React.useState(null);
        const [showNewTabForm, setShowNewTabForm] = React.useState(false);
        const [showPaymentForm, setShowPaymentForm] = React.useState(false);
        const [toasts, setToasts] = React.useState([]);
        const [autoOpenProductSelector, setAutoOpenProductSelector] = React.useState(false);
        
        // Carrega as comandas e configura os listeners para atualizações em tempo real
        React.useEffect(() => {
            // Carregar comandas iniciais
            const openTabs = TabManager.getOpenTabs();
            setTabs(openTabs);
            
            // Configurar listener para atualizações em tempo real
            const handleTabsChanged = (data) => {
                setTabs(data.openTabs);
                
                // Se uma comanda selecionada for fechada, voltar para a lista
                if (selectedTabId && !data.openTabs.some(tab => tab.id === selectedTabId)) {
                    setSelectedTabId(null);
                    showToast({
                        message: "A comanda foi fechada em outro dispositivo",
                        type: "info"
                    });
                }
            };
            
            // Adicionar listener
            TabManager.addTabChangeListener(handleTabsChanged);
            
            // Remover listener quando o componente for desmontado
            return () => {
                TabManager.removeTabChangeListener(handleTabsChanged);
            };
        }, [selectedTabId]); // Dependência para reavaliar se a comanda selecionada foi fechada
        
        const handleSelectTab = (tab) => {
            setSelectedTabId(tab.id);
        };
        
        const handleCreateTab = () => {
            setShowNewTabForm(true);
        };
        
        const handleNewTabSubmit = async (formData) => {
            try {
                console.log('Criando nova comanda com dados:', formData);
                
                const newTab = await TabManager.createTab(formData.customerName);
                
                if (newTab) {
                    // Garantir que a nova comanda tenha um array items inicializado
                    if (!newTab.items) {
                        newTab.items = [];
                        // Atualizar a comanda no TabManager
                        await TabManager.updateTab(newTab.id, { items: [] });
                    }
                    
                    setSelectedTabId(newTab.id);
                    setShowNewTabForm(false);
                    // Marcar para abrir o seletor de produtos automaticamente
                    setAutoOpenProductSelector(true);
                    
                    showToast({
                        message: `Comanda #${newTab.number} criada com sucesso!`,
                        type: 'success'
                    });
                } else {
                    showToast({
                        message: 'Erro ao criar comanda.',
                        type: 'error'
                    });
                }
            } catch (error) {
                console.error('Erro ao criar comanda:', error);
                showToast({
                    message: 'Erro ao criar comanda.',
                    type: 'error'
                });
            }
        };
        
        const handleNewTabCancel = () => {
            setShowNewTabForm(false);
        };
        
        const handleAddItem = async (tabId, item) => {
            try {
                console.log('Tentando adicionar item à comanda. TabID:', tabId, 'Item:', item);
                
                if (!tabId || !item) {
                    console.error('TabID ou item inválido');
                    return;
                }
                
                // Buscar a comanda atual
                const currentTab = tabs.find(t => t.id === tabId);
                if (!currentTab) {
                    console.error('Comanda não encontrada localmente. ID:', tabId);
                    return;
                }
                
                console.log('Comanda encontrada:', currentTab);
                
                // Garantir que a comanda tenha um array de itens
                if (!Array.isArray(currentTab.items)) {
                    console.warn('Comanda não tem array de itens', currentTab);
                    currentTab.items = [];
                }
                
                // Verificar se já existe um item com o mesmo nome
                const existingItemIndex = currentTab.items.findIndex(
                    existingItem => existingItem.name.toLowerCase() === item.name.toLowerCase()
                );
                
                let updatedItems;
                let actionMessage;
                
                if (existingItemIndex >= 0) {
                    // Se o item já existe, incrementar a quantidade
                    updatedItems = [...currentTab.items];
                    updatedItems[existingItemIndex] = {
                        ...updatedItems[existingItemIndex],
                        quantity: updatedItems[existingItemIndex].quantity + 1
                    };
                    actionMessage = `Quantidade de ${item.name} aumentada para ${updatedItems[existingItemIndex].quantity}.`;
                } else {
                    // Se o item não existe, adicionar como novo
                    updatedItems = [...currentTab.items, item];
                    actionMessage = `${item.name} adicionado à comanda.`;
                }
                
                console.log('Items atualizados:', updatedItems);
                
                // Usar o TabManager para atualizar a comanda
                const success = await TabManager.updateTab(tabId, { items: updatedItems });
                
                if (success) {
                    console.log('Item adicionado/atualizado com sucesso!');
                    showToast({
                        message: actionMessage,
                        type: 'success',
                        duration: 2000
                    });
                } else {
                    console.error('Falha ao adicionar item à comanda');
                    showToast({
                        message: 'Erro ao adicionar item. Tente novamente.',
                        type: 'error'
                    });
                }
            } catch (error) {
                console.error('Erro ao processar adição de item:', error);
                showToast({
                    message: 'Erro ao adicionar item. Tente novamente.',
                    type: 'error'
                });
            }
        };
        
        const handleRemoveItem = async (tabId, itemId) => {
            const updatedTab = await TabManager.removeItemFromTab(tabId, itemId);
            
            if (updatedTab) {
                showToast({
                    message: 'Item removido da comanda.',
                    type: 'success',
                    duration: 2000
                });
            } else {
                showToast({
                    message: 'Erro ao remover item.',
                    type: 'error'
                });
            }
        };
        
        const handleUpdateItem = async (tabId, itemId, updates) => {
            const updatedTab = await TabManager.updateItemInTab(tabId, itemId, updates);
            
            if (!updatedTab) {
                showToast({
                    message: 'Erro ao atualizar item.',
                    type: 'error'
                });
            }
        };
        
        const handleCloseTab = (tab) => {
            setShowPaymentForm(true);
        };
        
        const handleDeleteTab = async (tabId) => {
            const success = await TabManager.deleteTab(tabId);
            
            if (success) {
                setSelectedTabId(null);
                
                showToast({
                    message: `Comanda excluída com sucesso!`,
                    type: 'success'
                });
            } else {
                showToast({
                    message: 'Erro ao excluir comanda.',
                    type: 'error'
                });
            }
        };
        
        const handlePaymentSubmit = async (paymentData) => {
            const selectedTab = tabs.find(tab => tab.id === selectedTabId);
            
            if (!selectedTab) {
                showToast({
                    message: 'Comanda não encontrada.',
                    type: 'error'
                });
                return;
            }
            
            const closedTab = await TabManager.closeTab(
                selectedTabId,
                paymentData.paymentMethod,
                paymentData.observations
            );
            
            if (closedTab) {
                setSelectedTabId(null);
                setShowPaymentForm(false);
                
                showToast({
                    message: `Comanda #${closedTab.number} fechada com sucesso!`,
                    type: 'success'
                });
            } else {
                showToast({
                    message: 'Erro ao fechar comanda.',
                    type: 'error'
                });
            }
        };
        
        const handlePaymentCancel = () => {
            setShowPaymentForm(false);
        };
        
        const handleBackToList = () => {
            setSelectedTabId(null);
        };
        
        // Toast management
        const showToast = (toast) => {
            const id = generateId();
            setToasts([...toasts, { ...toast, id }]);
            
            // Auto-remove after duration - reduzido para 2 segundos
            setTimeout(() => {
                removeToast(id);
            }, 2000);
        };
        
        const removeToast = (id) => {
            setToasts(toasts.filter(toast => toast.id !== id));
        };
        
        // Get the selected tab
        const selectedTab = tabs.find(tab => tab.id === selectedTabId);
        
        return (
            <div data-name="tabs-page" className="p-4">
                <h1 className="page-title">Comandas</h1>
                
                {/* Show tab list or tab details based on selection */}
                {!selectedTabId ? (
                    <React.Fragment>
                        <div data-name="tabs-header" className="flex justify-between items-center mb-4">
                            <div data-name="tabs-count" className="text-gray-400">
                                {tabs.length} comandas abertas
                            </div>
                            
                            <button
                                data-name="new-tab-button"
                                className="btn btn-primary"
                                onClick={handleCreateTab}
                            >
                                <i className="fas fa-plus mr-2"></i>
                                Nova Comanda
                            </button>
                        </div>
                        
                        {tabs.length === 0 ? (
                            <div data-name="empty-tabs" className="empty-state">
                                <div className="empty-state-icon">
                                    <i className="fas fa-receipt"></i>
                                </div>
                                <div className="empty-state-text">Nenhuma comanda aberta no momento</div>
                                <button
                                    className="btn btn-primary mt-4"
                                    onClick={handleCreateTab}
                                >
                                    <i className="fas fa-plus mr-2"></i>
                                    Criar Nova Comanda
                                </button>
                            </div>
                        ) : (
                            <TabList
                                tabs={tabs}
                                onSelectTab={handleSelectTab}
                                onCreateTab={handleCreateTab}
                                selectedTabId={selectedTabId}
                            />
                        )}
                    </React.Fragment>
                ) : (
                    <TabDetails
                        tab={selectedTab}
                        onAddItem={handleAddItem}
                        onRemoveItem={handleRemoveItem}
                        onUpdateItem={handleUpdateItem}
                        onCloseTab={handleCloseTab}
                        onBack={handleBackToList}
                        onDeleteTab={handleDeleteTab}
                        autoOpenProductSelector={autoOpenProductSelector}
                        onProductSelectorOpened={() => setAutoOpenProductSelector(false)}
                    />
                )}
                
                {/* New Tab Modal */}
                {showNewTabForm && (
                    <Modal
                        isOpen={showNewTabForm}
                        onClose={handleNewTabCancel}
                        title="Nova Comanda"
                    >
                        <TabForm
                            onSubmit={handleNewTabSubmit}
                            onCancel={handleNewTabCancel}
                        />
                    </Modal>
                )}
                
                {/* Payment Modal */}
                {showPaymentForm && selectedTab && (
                    <Modal
                        isOpen={showPaymentForm}
                        onClose={handlePaymentCancel}
                        title={null}
                    >
                        <PaymentForm
                            tab={selectedTab}
                            onSubmit={handlePaymentSubmit}
                            onCancel={handlePaymentCancel}
                        />
                    </Modal>
                )}
                
                {/* Toast Notifications */}
                <ToastContainer toasts={toasts} removeToast={removeToast} />
            </div>
        );
    } catch (error) {
        console.error('TabsPage error:', error);
        reportError(error);
        return (
            <div className="p-4 text-center text-red-500">
                <p>Erro ao carregar a página de comandas.</p>
            </div>
        );
    }
}
