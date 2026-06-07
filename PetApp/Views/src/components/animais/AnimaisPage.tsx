import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import {
    carregarAnimais,
    criarAnimal,
    atualizarAnimal,
    excluirAnimal,
    selecionarAnimal,
    limparConfirmacaoExclusaoAnimal
} from '../../store/animaisSlice';
import { Animal, AnimalCreate, AnimalUpdate } from '../../api/animaisApi';
import { AnimaisList } from './AnimaisList';
import { AnimalForm } from './AnimalForm';
import { AnimalDeleteModal } from './AnimalDeleteModal';
import { Paginacao } from '../common/Paginacao';

export const AnimaisPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { itens, carregando, erro, selecionado, confirmacaoExclusao } = useSelector(
        (state: RootState) => state.animais
    );

    const [modoEdicao, setModoEdicao] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [pagina, setPagina] = useState(1);
    const [tamanhoPagina, setTamanhoPagina] = useState(10);

    useEffect(() => {
        dispatch(carregarAnimais());
    }, [dispatch]);

    const totalPaginas = Math.max(1, Math.ceil(itens.length / tamanhoPagina));

    useEffect(() => {
        if (pagina > totalPaginas) {
            setPagina(totalPaginas);
        }
    }, [pagina, totalPaginas]);

    const animaisPaginados = useMemo(() => {
        const inicio = (pagina - 1) * tamanhoPagina;
        return itens.slice(inicio, inicio + tamanhoPagina);
    }, [itens, pagina, tamanhoPagina]);

    const animalConfirmacao = useMemo(() => {
        if (!confirmacaoExclusao) {
            return null;
        }

        return itens.find(a => a.id === confirmacaoExclusao.id) ?? null;
    }, [confirmacaoExclusao, itens]);

    const handleNovo = () => {
        dispatch(selecionarAnimal(null));
        setModoEdicao(false);
        setShowFormModal(true);
    };

    const handleEditar = (animal: Animal) => {
        dispatch(selecionarAnimal(animal));
        setModoEdicao(true);
        setShowFormModal(true);
    };

    const handleSalvar = async (dados: AnimalCreate | AnimalUpdate) => {
        if ('id' in dados && dados.id > 0) {
            const result = await dispatch(atualizarAnimal(dados as AnimalUpdate));

            if (atualizarAnimal.fulfilled.match(result)) {
                setShowFormModal(false);
            }

            return;
        }

        const result = await dispatch(criarAnimal(dados as AnimalCreate));

        if (criarAnimal.fulfilled.match(result)) {
            setShowFormModal(false);
            setPagina(1);
        }
    };

    const handleSolicitarExcluir = async (id: number) => {
        await dispatch(excluirAnimal({ id }));
    };

    const handleConfirmarExcluirComCastracoes = async () => {
        if (!confirmacaoExclusao) {
            return;
        }

        await dispatch(excluirAnimal({
            id: confirmacaoExclusao.id,
            excluirCastracoes: true
        }));
    };

    const handleCancelarExclusaoComCastracoes = () => {
        dispatch(limparConfirmacaoExclusaoAnimal());
    };

    const handleMudarTamanhoPagina = (novoTamanho: number) => {
        setTamanhoPagina(novoTamanho);
        setPagina(1);
    };

    return (
        <div className="row">
            <div className="col-12 mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <h2 className="h4 mb-0">Lista de Animais</h2>
                    <button className="btn btn-primary btn-sm" onClick={handleNovo}>
                        Novo Animal
                    </button>
                </div>

                {carregando && <div className="alert alert-info">Carregando...</div>}
                {erro && <div className="alert alert-danger">{erro}</div>}

                <AnimaisList
                    animais={animaisPaginados}
                    onEditar={handleEditar}
                    onExcluir={handleSolicitarExcluir}
                />

                {itens.length > 0 && (
                    <Paginacao
                        pagina={pagina}
                        tamanhoPagina={tamanhoPagina}
                        totalRegistros={itens.length}
                        onMudarPagina={setPagina}
                        onMudarTamanhoPagina={handleMudarTamanhoPagina}
                    />
                )}
            </div>

            {showFormModal && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {modoEdicao && selecionado ? 'Editar Animal' : 'Novo Animal'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowFormModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <AnimalForm
                                    animal={modoEdicao ? selecionado ?? undefined : undefined}
                                    onSubmit={handleSalvar}
                                    onCancel={() => setShowFormModal(false)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <AnimalDeleteModal
                animal={animalConfirmacao}
                totalCastracoes={confirmacaoExclusao?.totalCastracoes ?? 0}
                mensagem={confirmacaoExclusao?.erro ?? ''}
                onCancel={handleCancelarExclusaoComCastracoes}
                onConfirm={handleConfirmarExcluirComCastracoes}
            />
        </div>
    );
};
