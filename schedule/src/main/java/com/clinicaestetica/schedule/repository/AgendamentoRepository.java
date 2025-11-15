package com.clinicaestetica.schedule.repository;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.clinicaestetica.schedule.enums.StatusAgendamento;
import com.clinicaestetica.schedule.model.Agendamento;

@Repository
public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {

    // Verifica se já existe agendamento no mesmo horário para o profissional
    boolean existsByProfissionalIdUsuarioAndDataHoraAndStatusNot(
            Long profissionalId,
            LocalDateTime dataHora,
            StatusAgendamento statusIgnorar
    );

    // CORRIGIDO: Buscar apenas agendamentos futuros que estão AGENDADO ou ALTERADO (não cancelados)
    @Query("SELECT a FROM Agendamento a WHERE a.cliente.idUsuario = :clienteId " +
           "AND a.dataHora > :dataAtual " +
           "AND (a.status = 'AGENDADO' OR a.status = 'ALTERADO') " +
           "ORDER BY a.dataHora ASC")
    List<Agendamento> findAgendamentosFuturos(@Param("clienteId") Long clienteId, @Param("dataAtual") LocalDateTime dataAtual);

    // Buscar agendamentos passados de um cliente (concluídos ou cancelados)
    @Query("SELECT a FROM Agendamento a WHERE a.cliente.idUsuario = :clienteId " +
           "AND (a.dataHora <= :dataAtual OR a.status = 'CONCLUÍDO' OR a.status = 'CANCELADO') " +
           "ORDER BY a.dataHora DESC")
    List<Agendamento> findAgendamentosPassados(@Param("clienteId") Long clienteId, @Param("dataAtual") LocalDateTime dataAtual);

    // Buscar todos os agendamentos de um cliente
    @Query("SELECT a FROM Agendamento a WHERE a.cliente.idUsuario = :clienteId ORDER BY a.dataHora DESC")
    List<Agendamento> findByClienteIdUsuario(@Param("clienteId") Long clienteId);

    // Buscar agendamentos por status
    List<Agendamento> findByStatus(StatusAgendamento status);

    // Buscar agendamentos por profissional
    @Query("SELECT a FROM Agendamento a WHERE a.profissional.idUsuario = :profissionalId ORDER BY a.dataHora ASC")
    List<Agendamento> findByProfissionalIdUsuario(@Param("profissionalId") Long profissionalId);

    // Buscar agendamentos por profissional e status
    List<Agendamento> findByProfissionalIdUsuarioAndStatus(Long profissionalId, StatusAgendamento status);
}