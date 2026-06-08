import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { carregarTutores, criarTutor } from '../../store/tutoresSlice';
import { Animal, AnimalCreate, AnimalUpdate } from '../../api/animaisApi';
import { TutorCreate } from '../../api/tutoresApi';
import { TutorForm } from '../tutores/TutorForm';

interface AnimalFormProps {
    animal?: Animal;
    onSubmit: (dados: AnimalCreate | AnimalUpdate) => void | Promise<void>;
    onCancel?: () => void;
    mode?: 'animal' | 'castracao';
}

interface FormState {
    id?: number;
    nome: string;
    especie: string;
    raca: string;
    sexo: string;
    idade: number | '';
    dataNascimentoIso: string;
    dataNascimentoBr: string;
    peso: number | '';
    idTutor: number;
    ehCastrado: boolean;
}

const initialForm: FormState = {
    nome: '',
    especie: '',
    raca: '',
    sexo: '',
    idade: '',
    dataNascimentoIso: '',
    dataNascimentoBr: '',
    peso: '',
    idTutor: 0,
    ehCastrado: false
};

const obterDataAtualIso = (): string => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
};

const aplicarMascaraDataBr = (valor: string): string => {
    const numeros = valor.replace(/\D/g, '').slice(0, 8);

    if (numeros.length <= 2) {
        return numeros;
    }

    if (numeros.length <= 4) {
        return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
    }

    return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4)}`;
};

const formatarIsoParaBr = (dataIso: string): string => {
    if (!dataIso) {
        return '';
    }

    const somenteData = dataIso.split('T')[0];
    const [ano, mes, dia] = somenteData.split('-');

    if (!ano || !mes || !dia) {
        return '';
    }

    return `${dia}/${mes}/${ano}`;
};

const converterBrParaIso = (dataBr: string): string => {
    const match = dataBr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (!match) {
        return '';
    }

    const [, dia, mes, ano] = match;
    const data = new Date(Number(ano), Number(mes) - 1, Number(dia));

    const dataValida =
        data.getFullYear() === Number(ano) &&
        data.getMonth() === Number(mes) - 1 &&
        data.getDate() === Number(dia);

    if (!dataValida) {
        return '';
    }

    return `${ano}-${mes}-${dia}`;
};

const normalizarDataApiParaIso = (data?: string | null): string => {
    if (!data) {
        return '';
    }

    const somenteData = data.split('T')[0];
    const [ano, mes, dia] = somenteData.split('-');

    if (!ano || !mes || !dia) {
        return '';
    }

    return `${ano}-${mes}-${dia}`;
};

const calcularIdade = (dataIso: string): { anos: number; meses: number; descricao: string } => {
    if (!dataIso) {
        return {
            anos: 0,
            meses: 0,
            descricao: 'informe a data de nascimento'
        };
    }

    const [ano, mes, dia] = dataIso.split('-').map(Number);

    if (!ano || !mes || !dia) {
        return {
            anos: 0,
            meses: 0,
            descricao: 'data inválida'
        };
    }

    const nascimento = new Date(ano, mes - 1, dia);
    const hoje = new Date();

    if (nascimento > hoje) {
        return {
            anos: 0,
            meses: 0,
            descricao: 'data futura'
        };
    }

    let anos = hoje.getFullYear() - nascimento.getFullYear();
    let meses = hoje.getMonth() - nascimento.getMonth();

    if (hoje.getDate() < nascimento.getDate()) {
        meses--;
    }

    if (meses < 0) {
        anos--;
        meses += 12;
    }

    anos = Math.max(anos, 0);
    meses = Math.max(meses, 0);

    if (anos === 0 && meses === 0) {
        return {
            anos,
            meses,
            descricao: 'menos de 1 mês'
        };
    }

    if (anos === 0) {
        return {
            anos,
            meses,
            descricao: meses === 1 ? '1 mês' : `${meses} meses`
        };
    }

    if (meses === 0) {
        return {
            anos,
            meses,
            descricao: anos === 1 ? '1 ano' : `${anos} anos`
        };
    }

    const textoAnos = anos === 1 ? '1 ano' : `${anos} anos`;
    const textoMeses = meses === 1 ? '1 mês' : `${meses} meses`;

    return {
        anos,
        meses,
        descricao: `${textoAnos} e ${textoMeses}`
    };
};

const converterIsoParaApi = (dataIso: string): string | null => {
    if (!dataIso) {
        return null;
    }

    return `${dataIso}T00:00:00`;
};

export const AnimalForm: React.FC<AnimalFormProps> = ({ animal, onSubmit, onCancel }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { itens: tutores, carregando: tutoresCarregando } = useSelector(
        (state: RootState) => state.tutores
    );

    const [form, setForm] = useState<FormState>(initialForm);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState<string | undefined>();
    const [showTutorModal, setShowTutorModal] = useState(false);
    const [salvandoTutor, setSalvandoTutor] = useState(false);
    const [erroTutor, setErroTutor] = useState<string | undefined>();
    const dataPickerRef = useRef<HTMLInputElement>(null);
    const tutoresSolicitadosRef = useRef(false);

    const idadeCalculada = useMemo(
        () => calcularIdade(form.dataNascimentoIso),
        [form.dataNascimentoIso]
    );

    useEffect(() => {
        if (!tutoresSolicitadosRef.current) {
            tutoresSolicitadosRef.current = true;
            dispatch(carregarTutores());
        }
    }, [dispatch]);

    useEffect(() => {
        if (animal) {
            const dataNascimentoIso = normalizarDataApiParaIso(animal.dataNascimento);

            setForm({
                id: animal.id,
                nome: animal.nome,
                especie: animal.especie,
                raca: animal.raca,
                sexo: animal.sexo,
                idade: animal.idade,
                dataNascimentoIso,
                dataNascimentoBr: formatarIsoParaBr(dataNascimentoIso),
                peso: animal.peso,
                idTutor: animal.idTutor,
                ehCastrado: animal.ehCastrado || false
            });

            return;
        }

        setForm(initialForm);
    }, [animal]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        let newValue: any = value;

        if (type === 'checkbox') {
            newValue = (e.target as HTMLInputElement).checked;
        } else if (name === 'peso') {
            newValue = value === '' ? '' : Number(value);
        } else if (name === 'idTutor') {
            newValue = value ? Number(value) : 0;
        }

        setForm(prev => ({
            ...prev,
            [name]: newValue
        }));
    };

    const handleDataNascimentoBrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valorBr = aplicarMascaraDataBr(e.target.value);
        const valorIso = converterBrParaIso(valorBr);

        setForm(prev => ({
            ...prev,
            dataNascimentoBr: valorBr,
            dataNascimentoIso: valorIso,
            idade: valorIso ? calcularIdade(valorIso).anos : ''
        }));
    };

    const handleDataPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valorIso = e.target.value;

        setForm(prev => ({
            ...prev,
            dataNascimentoIso: valorIso,
            dataNascimentoBr: formatarIsoParaBr(valorIso),
            idade: valorIso ? calcularIdade(valorIso).anos : ''
        }));
    };

    const abrirCalendario = () => {
        const picker = dataPickerRef.current as HTMLInputElement & {
            showPicker?: () => void;
        };

        if (!picker) {
            return;
        }

        if (typeof picker.showPicker === 'function') {
            picker.showPicker();
            return;
        }

        picker.click();
    };

    const handleCriarTutor = async (dados: TutorCreate) => {
        setErroTutor(undefined);

        try {
            setSalvandoTutor(true);

            const result = await dispatch(criarTutor(dados));

            if (criarTutor.fulfilled.match(result)) {
                const novoTutor = result.payload;

                setForm(prev => ({
                    ...prev,
                    idTutor: novoTutor.id
                }));

                setShowTutorModal(false);
                await dispatch(carregarTutores());
                return;
            }

            const payload: any = result.payload;
            setErroTutor(
                typeof payload === 'string'
                    ? payload
                    : payload?.erro ?? 'Erro ao criar tutor.'
            );
        } finally {
            setSalvandoTutor(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro(undefined);

        if (!form.nome?.trim()) {
            setErro('Nome do animal é obrigatório.');
            return;
        }

        if (!form.especie?.trim()) {
            setErro('Espécie é obrigatória.');
            return;
        }

        if (!form.raca?.trim()) {
            setErro('Raça é obrigatória.');
            return;
        }

        if (!form.sexo) {
            setErro('Sexo é obrigatório.');
            return;
        }

        if (form.dataNascimentoBr && !form.dataNascimentoIso) {
            setErro('Data de nascimento inválida. Use o formato dd/mm/aaaa.');
            return;
        }

        if (!form.idTutor || form.idTutor <= 0) {
            setErro(`Selecione um tutor válido. ID recebido: ${form.idTutor}`);
            return;
        }

        const tutorValido = tutores.find(t => t.id === form.idTutor);

        if (!tutorValido) {
            setErro(`Tutor com ID ${form.idTutor} não encontrado na lista de tutores válidos.`);
            return;
        }

        const idadeParaSalvar = form.dataNascimentoIso
            ? idadeCalculada.anos
            : form.idade
              ? Number(form.idade)
              : 0;

        const payloadBase = {
            nome: form.nome.trim(),
            especie: form.especie.trim(),
            raca: form.raca.trim(),
            sexo: form.sexo,
            idade: idadeParaSalvar,
            dataNascimento: converterIsoParaApi(form.dataNascimentoIso),
            peso: form.peso ? Number(form.peso) : 0,
            idTutor: form.idTutor,
            ehCastrado: form.ehCastrado
        };

        const payload: AnimalCreate | AnimalUpdate = form.id
            ? {
                  id: form.id,
                  ...payloadBase
              }
            : payloadBase;

        try {
            setSalvando(true);
            await onSubmit(payload);

            if (!form.id) {
                setForm(initialForm);
            }
        } catch {
            setErro('Erro ao salvar animal. Tente novamente.');
        } finally {
            setSalvando(false);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="card">
                <div className="card-body">
                    {erro && <div className="alert alert-danger">{erro}</div>}

                    <div className="mb-2">
                        <label className="form-label">Nome *</label>
                        <input
                            type="text"
                            name="nome"
                            className="form-control form-control-sm"
                            value={form.nome}
                            onChange={handleChange}
                            maxLength={200}
                            required
                        />
                    </div>

                    <div className="mb-2">
                        <label className="form-label">Espécie *</label>
                        <select
                            name="especie"
                            className="form-select form-select-sm"
                            value={form.especie}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Selecione...</option>
                            <option value="Felina">Felina</option>
                            <option value="Canina">Canina</option>
                            <option value="Outros">Outros</option>
                        </select>
                    </div>

                    <div className="mb-2">
                        <label className="form-label">Raça *</label>
                        <input
                            type="text"
                            name="raca"
                            className="form-control form-control-sm"
                            value={form.raca}
                            onChange={handleChange}
                            maxLength={100}
                            required
                        />
                    </div>

                    <div className="mb-2">
                        <label className="form-label">Sexo *</label>
                        <select
                            name="sexo"
                            className="form-select form-select-sm"
                            value={form.sexo}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Selecione...</option>
                            <option value="M">Macho</option>
                            <option value="F">Fêmea</option>
                        </select>
                    </div>

                    <div className="mb-2 form-check">
                        <input
                            type="checkbox"
                            name="ehCastrado"
                            className="form-check-input"
                            id="ehCastradoCheck"
                            checked={form.ehCastrado}
                            onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="ehCastradoCheck">
                            É Castrado?
                        </label>
                    </div>

                    <div className="row">
                        <div className="col-md-4 mb-2">
                            <label className="form-label">Data de nascimento</label>
                            <div className="input-group input-group-sm">
                                <input
                                    type="text"
                                    name="dataNascimentoBr"
                                    className="form-control"
                                    value={form.dataNascimentoBr}
                                    onChange={handleDataNascimentoBrChange}
                                    placeholder="dd/mm/aaaa"
                                    inputMode="numeric"
                                    maxLength={10}
                                />
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={abrirCalendario}
                                    title="Selecionar data"
                                >
                                    📅
                                </button>
                                <input
                                    ref={dataPickerRef}
                                    type="date"
                                    value={form.dataNascimentoIso}
                                    onChange={handleDataPickerChange}
                                    max={obterDataAtualIso()}
                                    style={{
                                        position: 'absolute',
                                        width: 1,
                                        height: 1,
                                        opacity: 0,
                                        pointerEvents: 'none'
                                    }}
                                    tabIndex={-1}
                                    aria-hidden="true"
                                />
                            </div>
                            <small className="form-text text-muted">
                                Idade calculada: {idadeCalculada.descricao}
                            </small>
                        </div>

                        <div className="col-md-4 mb-2">
                            <label className="form-label">Peso (kg)</label>
                            <input
                                type="number"
                                name="peso"
                                className="form-control form-control-sm"
                                value={form.peso}
                                onChange={handleChange}
                                min={0}
                                max={1000}
                                step="0.1"
                            />
                        </div>

                        <div className="col-md-4 mb-2">
                            <div className="d-flex justify-content-between align-items-center">
                                <label className="form-label mb-0">Tutor *</label>
                                <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm py-0"
                                    onClick={() => {
                                        setErroTutor(undefined);
                                        setShowTutorModal(true);
                                    }}
                                    disabled={salvando}
                                >
                                    + Novo tutor
                                </button>
                            </div>

                            <select
                                name="idTutor"
                                className="form-select form-select-sm mt-1"
                                value={form.idTutor || 0}
                                onChange={handleChange}
                                required
                            >
                                <option value={0}>Selecione um tutor...</option>
                                {tutores.map(tutor => (
                                    <option key={tutor.id} value={tutor.id}>
                                        {tutor.nome}
                                    </option>
                                ))}
                            </select>
                            <small className="form-text text-muted">
                                {tutoresCarregando
                                    ? 'Carregando tutores...'
                                    : tutores.length > 0
                                      ? `Tutores disponíveis: ${tutores.length}`
                                      : 'Nenhum tutor cadastrado. Clique em + Novo tutor para cadastrar.'}
                            </small>
                        </div>
                    </div>
                </div>

                <div className="card-footer d-flex justify-content-end gap-2">
                    {onCancel && (
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={onCancel}
                            disabled={salvando}
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        className="btn btn-primary btn-sm"
                        type="submit"
                        disabled={salvando}
                    >
                        {salvando ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </form>

            {showTutorModal && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Novo Tutor</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowTutorModal(false)}
                                    disabled={salvandoTutor}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {erroTutor && <div className="alert alert-danger">{erroTutor}</div>}

                                <TutorForm
                                    onSubmit={handleCriarTutor}
                                    onCancel={() => setShowTutorModal(false)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
