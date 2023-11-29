import { Component, OnInit, ViewChild } from '@angular/core';
import { PagoMembresiaEfectivoService } from 'src/app/service/pago-membresia-efectivo.service'
import { MatPaginator } from '@angular/material/paginator'; //para paginacion en la tabla
import { MatTableDataSource } from '@angular/material/table'; //para controlar los datos del api y ponerlos en una tabla
import { MensajeEmergenteComponent } from '../mensaje-emergente/mensaje-emergente.component';
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Router,  ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { FormPagoEmergenteComponent } from '../form-pago-emergente/form-pago-emergente.component';

@Component({
  selector: 'app-lista-membresias-pago-efec',
  templateUrl: './lista-membresias-pago-efec.component.html',
  styleUrls: ['./lista-membresias-pago-efec.component.css']
})

export class ListaMembresiasPagoEfecComponent implements OnInit{
  clientePago: any;
  clienteActivo: any;
  clienteReenovacion : any;
  //dataSource: any[] = []; // Inicializa tu fuente de datos
  dataSource: any; // instancia para matTableDatasource
  dataSourceActivos: any;
  dataSourceReenovacion: any;
  //titulos de columnas de la tabla de pago online
  displayedColumns: string[] = [
    'ID',
    'Nombre',
    'Sucursal',
    'Membresia',
    'Precio',
    'Status',
    'Dinero recibido',
    'Pagar',
  ];
  //titulos de columnas de la tabla clientes activos
  displayedColumnsActivos: string[] = [
    'ID',
    'Nombre',
    'Sucursal',
    'Membresia',
    'Info_Membresia',
    'Fecha_Inicio',
    'Fecha_Fin',
    'Status',
  ];

  //titulos de columnas de la tabla Reenovacion de membresias
  displayedColumnsReenovacionMem: string[] = [
    'ID',
    'Nombre',
    'Sucursal',
    'Membresia',
    'Precio',
    'Fecha_Inicio',
    'Fecha_Fin',
    'Status',
    'Dinero recibido',
    'Pagar',
    'Actualizar',
  ];
  dineroRecibido: number; // =0
  moneyRecibido: number; // =0
  IDvalid: number;

  //paginator es una variable de la clase MatPaginator
  @ViewChild('paginatorPagoOnline', { static: true }) paginator!: MatPaginator;
  @ViewChild('paginatorActivos', { static: true }) paginatorActivos!: MatPaginator;
  @ViewChild('paginatorReenovacionMem', { static: true }) paginatorReenovacion!: MatPaginator;

  constructor(private pagoService: PagoMembresiaEfectivoService,public dialog: MatDialog, private router: Router, private toastr: ToastrService){

  }

  ngOnInit(): void{
    this.pagoService.obternerDataMem().subscribe(respuesta=>{
      console.log(respuesta);
      this.clientePago = respuesta;
      this.dataSource = new MatTableDataSource(this.clientePago);
      this.dataSource.paginator = this.paginator;
    });


    this.pagoService.obtenerActivos().subscribe(response=>{
      console.log(response);
      this.clienteActivo = response;
      this.dataSourceActivos = new MatTableDataSource(this.clienteActivo);
      this.dataSourceActivos.paginator = this.paginatorActivos;
    });

    this.pagoService.clientesMemReenovar().subscribe(data=>{
      console.log(data);
      this.clienteReenovacion = data;
      this.dataSourceReenovacion = new MatTableDataSource(this.clienteReenovacion);
      this.dataSourceReenovacion.paginator = this.paginatorReenovacion;
    })
  }

  //Filtrar la informacion que escribe el usuario
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  applyFilterActivos(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSourceActivos.filter = filterValue.trim().toLowerCase();
  }

  applyFilterReenovacion(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSourceReenovacion.filter = filterValue.trim().toLowerCase();
  }

  //Se resta el dinero recibido del precio para el apartado de actualizacion de membresia
  realizarPago(updMem: any): void{

    if(updMem.moneyRecibido >= updMem.Precio){
      updMem.PrecioCalcular = updMem.moneyRecibido - updMem.Precio ;
      console.log(updMem.PrecioCalcular)
      console.log(updMem.ID)

      this.pagoService.pagoMemOpcion1(updMem.ID).subscribe((dataResponse: any)=> {
        console.log(dataResponse.msg)

        // Eliminar la fila de la tabla uno
        const index = this.dataSourceReenovacion.data.indexOf(updMem);
        if (index !== -1) {
          this.dataSourceReenovacion.data.splice(index, 1);
          this.dataSourceReenovacion._updateChangeSubscription(); // Notificar a la tabla sobre el cambio
        }

        // Agregar y Actualizar la fila a la tabla dos (dataSourceActivos)
        this.pagoService.obtenerActivos().subscribe(respuesta => {
          console.log(respuesta);
          this.clienteActivo = respuesta;
          // Actualizar la fuente de datos de la segunda tabla (dataSourceActivos)
          this.dataSourceActivos.data = this.clienteActivo.slice();
          // Notificar a la tabla sobre el cambio
          this.dataSourceActivos._updateChangeSubscription();
        });

        this.dialog.open(MensajeEmergenteComponent, {
          data: `Pago exitoso, el cambio es de: $${updMem.PrecioCalcular}`,
        })
        .afterClosed()
        .subscribe((cerrarDialogo: Boolean) => {
          if (cerrarDialogo) {
            // Recargar la página actual
            //location.reload();
            //this.router.navigateByUrl(`/index/`);
          } else {
  
          }
        });

      });
    }else{
      this.toastr.error('No alcanza para pagar esta membresia', 'Error!!!');
    }

  }

  abrirEmergente(updMem: any) {
    // Abre el diálogo y almacena la referencia
    const dialogRef = this.dialog.open(FormPagoEmergenteComponent, {
      data: {
        idCliente: `${updMem.ID}`,
        nombre: `${updMem.Nombre}`,
        sucursal: `${updMem.Sucursal}`,
        membresia: `${updMem.Membresia}`,
        precio: `${updMem.Precio}`,
        duracion: `${updMem.Duracion}`,
        idSucursal: `${updMem.Gimnasio_idGimnasio}`,
      },
    });
  
    // Suscríbete al evento actualizarTablas del diálogo
    dialogRef.componentInstance.actualizarTablas.subscribe((actualizar: boolean) => {
      if (actualizar) {
        // Realiza las operaciones de actualización necesarias aquí
        // Eliminar la fila de la tabla uno
        const index = this.dataSourceReenovacion.data.indexOf(updMem);
        if (index !== -1) {
          this.dataSourceReenovacion.data.splice(index, 1);
          this.dataSourceReenovacion._updateChangeSubscription(); // Notificar a la tabla sobre el cambio
        }
  
        // Agregar y Actualizar la fila a la tabla dos (dataSourceActivos)
        this.pagoService.obtenerActivos().subscribe((respuesta) => {
          console.log(respuesta);
          this.clienteActivo = respuesta;
          // Actualizar la fuente de datos de la segunda tabla (dataSourceActivos)
          this.dataSourceActivos.data = this.clienteActivo.slice();
          // Notificar a la tabla sobre el cambio
          this.dataSourceActivos._updateChangeSubscription();
        });
      }
    });
  
    // Suscríbete al evento afterClosed() para manejar el caso en que se cierra el diálogo
    dialogRef.afterClosed().subscribe((cancelDialog: boolean) => {
      if (cancelDialog) {
        // Lógica cuando se cierra el diálogo de forma cancelada
      } else {
        // Lógica cuando se cierra el diálogo de otra manera
      }
    });
  }
  

  //Se resta el dinero recibido del precio para el apartado de pago de membresia cliente online
  realizarCalculo(prod: any): void {
    if(prod.dineroRecibido >= prod.Precio){
      prod.PrecioCalculado = prod.dineroRecibido - prod.Precio ;
      console.log(prod.PrecioCalculado)

      this.pagoService.idPagoSucursal(prod.ID, prod.idDetMem).subscribe((response: any) => {
        console.log(response.msg)

        // Eliminar la fila de la tabla uno
        const index = this.dataSource.data.indexOf(prod);
        if (index !== -1) {
          this.dataSource.data.splice(index, 1);
          this.dataSource._updateChangeSubscription(); // Notificar a la tabla sobre el cambio
        }
        
        // Agregar y Actualizar la fila a la tabla dos (dataSourceActivos)
        this.pagoService.obtenerActivos().subscribe(response => {
          console.log(response);
          this.clienteActivo = response;
          // Actualizar la fuente de datos de la segunda tabla (dataSourceActivos)
          this.dataSourceActivos.data = this.clienteActivo.slice();
          // Notificar a la tabla sobre el cambio
          this.dataSourceActivos._updateChangeSubscription();
        });

        this.dialog.open(MensajeEmergenteComponent, {
          data: `Pago exitoso, el cambio es de: $${prod.PrecioCalculado}`,
        })
        .afterClosed()
        .subscribe((cerrarDialogo: Boolean) => {
          if (cerrarDialogo) {
            // Recargar la página actual
            //location.reload();
            //this.router.navigateByUrl(`/index/`);
          } else {
  
          }
        });
      });
    }else{
      this.toastr.error('No alcanza para pagar esta membresia', 'Error!!!');
    }
  }


}