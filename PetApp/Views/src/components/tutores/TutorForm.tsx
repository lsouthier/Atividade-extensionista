import React, { useEffect, useState } from 'react';
import { Tutor, TutorCreate, TutorUpdate } from '../../api/tutoresApi';

interface TutorFormProps {
    tutor?: Tutor;
    onSubmit: (dados: TutorCreate | TutorUpdate) => void | Promise<void>;
    onCancel?: () => void;
}

interface FormState {
    id?: number;
    nome: string;
    endereco: string;
    telefone: string;
}

const initialForm: FormState = {
    nome: '',
    endereco: '',
    telefone: ''
};

export const TutorForm: React.FC<TutorFormProps> = ({ tutor, onSubmit, onCancel }) => {
    const [form, setForm] = useState<FormState>(initialForm);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState<string | undefined>();

    useEffect(() => {
        if (tutor) {
            console.log('📝 Editando tutor:', tutor);
            setForm({
                id: tutor.id,
                nome: tutor.nome,
                endereco: tutor.endereco,
                telefone: tutor.telefone
            });
        } else {
            console.log('✨ Criando novo tutor');
            setForm(initialForm);
        }
    }, [tutor]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target;

        let novoValor = value;
        if (name === 'telefone') {
            // Remove tudo que não é dígito
            let v = value.replace(/\D/g, '');
            
            // Limita a 11 dígitos
            if (v.length > 11) v = v.substring(0, 11);

            // Formata apenas se houver dígitos
            if (v.length > 0) {
                if (v.length <= 10) {
                    v = v.replace(/(\d{2})(\d)/, '($1) $2');
                    v = v.replace(/(\d{4})(\d)/, '$1-$2');
                } else {
                    v = v.replace(/(\d{2})(\d)/, '($1) $2');
                    v = v.replace(/(\d{5})(\d{4})/, '$1-$2');
                }
            }
            novoValor = v;
        }

        setForm(prev => ({
            ...prev,
            [name]: novoValor
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro(undefined);

        console.log('📤 Validando formulário de tutor...');
        console.log('Estado do formulário:', form);

        // 🔴 Validação rigorosa
        if (!form.nome || !form.nome.trim()) {
            const msg = 'Nome do tutor é obrigatório.';
            console.error('❌', msg);
            setErro(msg);
            return;
        }

        // Remove espaços em branco
        const nomeLinpo = form.nome.trim();
        const enderecoLimpo = form.endereco.trim();
        const telefoneLimpo = form.telefone.trim();

        // Rejeita telefone vazio ou placeholder
        if (telefoneLimpo === '' || telefoneLimpo === '(99) 99999-9999') {
            console.log('⚠️ Telefone descartado (vazio ou placeholder)');
        }

        const payload: TutorCreate | TutorUpdate = form.id
            ? {
                  id: form.id,
                  nome: nomeLinpo,
                  endereco: enderecoLimpo,
                  telefone: telefoneLimpo === '(99) 99999-9999' ? '' : telefoneLimpo
              }
            : {
                  nome: nomeLinpo,
                  endereco: enderecoLimpo,
                  telefone: telefoneLimpo === '(99) 99999-9999' ? '' : telefoneLimpo
              };

        console.log('📨 Payload a enviar:', payload);

        try {
            setSalvando(true);
            await onSubmit(payload);
            if (!form.id) {
                setForm(initialForm);
            }
            console.log('✓ Tutor salvo com sucesso!');
        } catch (error) {
            console.error('✗ Erro ao salvar:', error);
            setErro('Erro ao salvar tutor.');
        } finally {
            setSalvando(false);
        }
    };

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
                    <label className="form-label">Endereço</label>
                    <input
                        type="text"
                        name="endereco"
                        className="form-control form-control-sm"
                        value={form.endereco}
                        onChange={handleChange}
                        maxLength={200}
                    />
                </div>

                <div className="mb-2">
                    <label className="form-label">Telefone</label>
                    <input
                        type="text"
                        name="telefone"
                        className="form-control form-control-sm"
                        value={form.telefone}
                        onChange={handleChange}
                        maxLength={15}
                        placeholder="(99) 99999-9999"
                    />
                    <small className="form-text text-muted">
                        Formato: (XX) XXXXX-XXXX
                    </small>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-3">
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
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={salvando || !form.nome.trim()}
                    >
                        {salvando ? '💾 Salvando...' : '💾 Salvar'}
                    </button>
                </div>
            </div>
        </form>
    );
};