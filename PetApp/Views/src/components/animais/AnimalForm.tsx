import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { carregarTutores } from '../../store/tutoresSlice';
import { Animal, AnimalCreate, AnimalUpdate } from '../../api/animaisApi';
import { Tutor } from '../../api/tutoresApi';

interface AnimalFormProps {
    animal?: Animal;
    onSubmit: (dados: AnimalCreate | AnimalUpdate) => void | Promise<void>;
    onCancel?: () => void;
    mode?: 'animal' | 'castracao'; // Novo: modo de formulário
}

interface FormState {
    id?: number;
    nome: string;
    especie: string;
    raca: string;
    sexo: string;
    idade: number | '';
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
    peso: '',
    idTutor: 0,
    ehCastrado: false
};

export const AnimalForm: React.FC<AnimalFormProps> = ({ animal, onSubmit, onCancel, mode }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { itens: tutores, carregando: tutoresCarregando } = useSelector(
        (state: RootState) => state.tutores
    );

    const [form, setForm] = useState<FormState>(initialForm);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState<string | undefined>();

    // Efeito 1: Carregar tutores do Redux apenas uma vez
    useEffect(() => {
        console.log('📥 AnimalForm montado - verificando tutores no Redux...');
        if (tutores.length === 0 && !tutoresCarregando) {
            console.log('⬇️ Carregando tutores do Redux...');
            dispatch(carregarTutores());
        } else {
            console.log('✓ Tutores já disponíveis:', tutores);
        }
    }, [dispatch]);

    // Efeito 2: Preencher formulário com dados do animal ou resetar
    useEffect(() => {
        if (animal) {
            console.log('📝 Editando animal:', animal);
            setForm({
                id: animal.id,
                nome: animal.nome,
                especie: animal.especie,
                raca: animal.raca,
                sexo: animal.sexo,
                idade: animal.idade,
                peso: animal.peso,
                idTutor: animal.idTutor,
                ehCastrado: animal.ehCastrado || false
            });
        } else {
            console.log('✨ Criando novo animal');
            setForm(initialForm);
        }
    }, [animal]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        let newValue: any = value;

        if (type === 'checkbox') {
            newValue = (e.target as HTMLInputElement).checked;
        } else if (name === 'idade' || name === 'peso') {
            newValue = value === '' ? '' : Number(value);
        } else if (name === 'idTutor') {
            const numValue = value ? Number(value) : 0;
            console.log(`🔄 idTutor alterado para: ${numValue} (valor bruto: ${value})`);
            newValue = numValue;
        }

        setForm(prev => ({
            ...prev,
            [name]: newValue
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro(undefined);

        // Validações rigorosas
        console.log('📤 Iniciando validação do formulário...');
        console.log('Estado do formulário:', form);

        if (!form.nome?.trim()) {
            const msg = 'Nome do animal é obrigatório.';
            console.error('❌', msg);
            setErro(msg);
            return;
        }

        if (!form.especie?.trim()) {
            const msg = 'Espécie é obrigatória.';
            console.error('❌', msg);
            setErro(msg);
            return;
        }

        if (!form.raca?.trim()) {
            const msg = 'Raça é obrigatória.';
            console.error('❌', msg);
            setErro(msg);
            return;
        }

        if (!form.sexo) {
            const msg = 'Sexo é obrigatório.';
            console.error('❌', msg);
            setErro(msg);
            return;
        }

        if (!form.idTutor || form.idTutor <= 0) {
            const msg = `Selecione um tutor válido. ID recebido: ${form.idTutor}`;
            console.error('❌', msg);
            setErro(msg);
            return;
        }

        // Verifica se o tutor selecionado existe na lista
        const tutorValido = tutores.find(t => t.id === form.idTutor);
        if (!tutorValido) {
            const msg = `Tutor com ID ${form.idTutor} não encontrado na lista de tutores válidos.`;
            console.error('❌', msg);
            setErro(msg);
            return;
        }

        console.log('✓ Validação passou! Tutor selecionado:', tutorValido);

        const payload: AnimalCreate | AnimalUpdate = form.id
            ? {
                  id: form.id,
                  nome: form.nome.trim(),
                  especie: form.especie.trim(),
                  raca: form.raca.trim(),
                  sexo: form.sexo,
                  idade: form.idade ? Number(form.idade) : 0,
                  peso: form.peso ? Number(form.peso) : 0,
                  idTutor: form.idTutor,
                  ehCastrado: form.ehCastrado
              }
            : {
                  nome: form.nome.trim(),
                  especie: form.especie.trim(),
                  raca: form.raca.trim(),
                  sexo: form.sexo,
                  idade: form.idade ? Number(form.idade) : 0,
                  peso: form.peso ? Number(form.peso) : 0,
                  idTutor: form.idTutor,
                  ehCastrado: form.ehCastrado
              };

        console.log('📨 Payload a enviar:', payload);

        try {
            setSalvando(true);
            await onSubmit(payload);
            if (!form.id) {
                setForm(initialForm);
            }
            console.log('✓ Animal salvo com sucesso!');
        } catch (error) {
            console.error('✗ Erro ao salvar:', error);
            setErro('Erro ao salvar animal. Tente novamente.');
        } finally {
            setSalvando(false);
        }
    };

    if (tutoresCarregando) {
        return <div className="alert alert-info">⏳ Carregando tutores...</div>;
    }

    if (tutores.length === 0) {
        return (
            <div className="alert alert-warning">
                ⚠️ Nenhum tutor disponível. Crie um tutor antes de adicionar um animal.
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="card">
            <div className="card-body">
                {erro && <div className="alert alert-danger">❌ {erro}</div>}

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
                    <input
                        type="text"
                        name="especie"
                        className="form-control form-control-sm"
                        value={form.especie}
                        onChange={handleChange}
                        maxLength={25}
                        required
                    />
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
                        <label className="form-label">Idade (anos)</label>
                        <input
                            type="number"
                            name="idade"
                            className="form-control form-control-sm"
                            value={form.idade}
                            onChange={handleChange}
                            min={0}
                            max={100}
                        />
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
                        <label className="form-label">Tutor *</label>
                        <select
                            name="idTutor"
                            className="form-select form-select-sm"
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
                            Tutores disponíveis: {tutores.length}
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
                    disabled={salvando || tutores.length === 0}
                >
                    {salvando ? '💾 Salvando...' : '💾 Salvar'}
                </button>
            </div>
        </form>
    );
};